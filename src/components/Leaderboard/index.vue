<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listAlgorithmType } from '@/core/madison-addon-algorithm-manager'
import {
  createLeaderboard,
  deleteLeaderboard,
  deleteLeaderboardItem,
  getLeaderboardDetail,
  listAvailableTrainRuns,
  listLeaderboard,
  rerunLeaderboardItem,
  toggleLeaderboardVisibility
} from '@/core/madison-addon-leaderboard'
import { queryDataset } from '@/core/madison-addon-dataset/core/api'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'
import type { AlgorithmTypeItem, ListAlgorithmTypeRes } from '@/core/madison-addon-algorithm-manager'
import type {
  AlgorithmTypeOption,
  AvailableTrainRunItem,
  CreateLeaderboardPayload,
  LeaderboardDetail,
  LeaderboardItem,
  LeaderboardRecord
} from '@/core/madison-addon-leaderboard'
import CreateDialog from './create-dialog.vue'
import DetailDrawer from './detail-drawer.vue'

const { t } = useI18n()

const loading = ref(false)
const createVisible = ref(false)
const creating = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const errorMessage = ref('')

const search = ref('')
const selectedAlgorithmTypeId = ref<number | '__all__'>('__all__')
const page = ref(1)
const pageSize = ref(10)

const leaderboards = ref<LeaderboardRecord[]>([])
const algorithmTypes = ref<AlgorithmTypeOption[]>([])
const datasets = ref<QueryDatasetResItem[]>([])
const availableTrainRuns = ref<AvailableTrainRunItem[]>([])
const detailData = ref<LeaderboardDetail | null>(null)
const deletingIds = ref<number[]>([])
const deletingItemIds = ref<number[]>([])
const rerunningIds = ref<number[]>([])
const togglingVisibilityIds = ref<number[]>([])

const pollingTimers = new Map<number, number>()
const activePollingIds = new Set<number>()
const pollingRequestIds = new Set<number>()

function extractErrorMessage(error: any, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return error?.data?.message || error?.response?.data?.message || error?.message || fallback
}

function getDataOrThrow<T>(response: any, fallback: string): T {
  if (!response || response.data?.code !== 0) {
    throw new Error(response?.data?.message || fallback)
  }
  return response.data.data as T
}

function toBoolean(value: unknown) {
  return value === true || value === 'True' || value === 'true' || value === 1 || value === '1'
}

function normalizeAlgorithmTypes(items: ListAlgorithmTypeRes): AlgorithmTypeOption[] {
  return (items || [])
    .map((item) => {
      if (typeof item === 'string') {
        return null
      }
      const record = item as AlgorithmTypeItem
      const id = Number(record.id)
      const name = record.name || record.algorithm_type || ''
      if (!Number.isFinite(id) || !name) return null
      return {
        id,
        name
      }
    })
    .filter((item): item is AlgorithmTypeOption => Boolean(item))
}

function normalizeLeaderboard(item: Record<string, any>): LeaderboardRecord {
  return {
    id: Number(item.id ?? 0),
    name: item.name ?? '',
    status: item.status ?? 'running',
    description: item.description ?? '',
    run_count: Number(item.run_count ?? 0),
    visibility: toBoolean(item.visibility),
    algorithm_type_id:
      item.algorithm_type_id !== undefined && item.algorithm_type_id !== null ? Number(item.algorithm_type_id) : null,
    algorithm_type_name: item.algorithm_type_name ?? item.algorithm_type ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : null,
    dataset_name: item.dataset_name ?? '',
    owner_id: item.owner_id !== undefined && item.owner_id !== null ? Number(item.owner_id) : null,
    owner_name: item.owner_name ?? '',
    is_owner: toBoolean(item.is_owner),
    created_at: item.created_at ?? '',
    updated_at: item.updated_at ?? ''
  }
}

function normalizeAvailableTrainRun(item: Record<string, any>): AvailableTrainRunItem {
  return {
    id: Number(item.id ?? 0),
    template_id: item.template_id !== undefined && item.template_id !== null ? Number(item.template_id) : null,
    algorithm_id: item.algorithm_id !== undefined && item.algorithm_id !== null ? Number(item.algorithm_id) : null,
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type_id:
      item.algorithm_type_id !== undefined && item.algorithm_type_id !== null ? Number(item.algorithm_type_id) : null,
    algorithm_type: item.algorithm_type ?? '',
    algorithm_type_name: item.algorithm_type_name ?? item.algorithm_type ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : null,
    dataset_name: item.dataset_name ?? '',
    status: item.status ?? '',
    created_at: item.created_at ?? '',
    finished_at: item.finished_at ?? null
  }
}

function normalizeDetail(item: Record<string, any>): LeaderboardDetail {
  return {
    ...normalizeLeaderboard(item),
    items: Array.isArray(item.items)
      ? item.items.map((entry: Record<string, any>) => ({
          item_id: Number(entry.item_id ?? 0),
          algorithm_id: entry.algorithm_id !== undefined && entry.algorithm_id !== null ? Number(entry.algorithm_id) : null,
          algorithm_name: entry.algorithm_name ?? '',
          source_run_id:
            entry.source_run_id !== undefined && entry.source_run_id !== null ? Number(entry.source_run_id) : null,
          test_run_id:
            entry.test_run_id !== undefined && entry.test_run_id !== null ? Number(entry.test_run_id) : null,
          item_status: entry.item_status ?? '',
          run_status: entry.run_status ?? '',
          evaluation_status: entry.evaluation_status ?? '',
          metrics_json: entry.metrics_json ?? null,
          error_message: entry.error_message ?? '',
          evaluation_error: entry.evaluation_error ?? '',
          created_at: entry.created_at ?? '',
          updated_at: entry.updated_at ?? ''
        }))
      : []
  }
}

function upsertLeaderboard(item: LeaderboardRecord) {
  const index = leaderboards.value.findIndex((entry) => entry.id === item.id)
  if (index === -1) {
    leaderboards.value = [item, ...leaderboards.value]
    return
  }
  leaderboards.value[index] = item
}

function updateLeaderboardVisibility(id: number, visibility: boolean, updatedAt?: string) {
  const index = leaderboards.value.findIndex((entry) => entry.id === id)
  if (index !== -1) {
    leaderboards.value[index] = {
      ...leaderboards.value[index],
      visibility,
      updated_at: updatedAt ?? leaderboards.value[index].updated_at
    }
  }
  if (detailData.value?.id === id) {
    detailData.value = {
      ...detailData.value,
      visibility,
      updated_at: updatedAt ?? detailData.value.updated_at
    }
  }
}

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function statusTagType(status: string) {
  if (status === 'finished') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

function formatStatus(status: string) {
  const key = `Leaderboard.Status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

function isActiveRecord(status: string) {
  return status === 'running'
}

function stopLeaderboardPolling(id: number) {
  const timer = pollingTimers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
  }
  pollingTimers.delete(id)
  activePollingIds.delete(id)
  pollingRequestIds.delete(id)
}

async function refreshLeaderboardDetail(id: number) {
  const res = await getLeaderboardDetail(id)
  const data = getDataOrThrow<Record<string, any>>(res, t('Leaderboard.Message.DetailFailed'))
  const normalized = normalizeDetail(data)
  upsertLeaderboard(normalized)
  if (detailData.value?.id === id) {
    detailData.value = normalized
  }
  return normalized
}

function queueLeaderboardPolling(id: number, delay: number = 3000) {
  if (!activePollingIds.has(id)) return
  const previousTimer = pollingTimers.get(id)
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer)
  }
  const timer = window.setTimeout(() => {
    void pollLeaderboardTask(id)
  }, delay)
  pollingTimers.set(id, timer)
}

async function pollLeaderboardTask(id: number) {
  if (!activePollingIds.has(id) || pollingRequestIds.has(id)) return

  pollingRequestIds.add(id)
  try {
    const detail = await refreshLeaderboardDetail(id)
    if (!activePollingIds.has(id)) return
    if (!isActiveRecord(detail.status)) {
      stopLeaderboardPolling(id)
      return
    }
    queueLeaderboardPolling(id)
  } catch (_) {
    stopLeaderboardPolling(id)
  } finally {
    pollingRequestIds.delete(id)
  }
}

function ensureLeaderboardPolling(id: number, immediate: boolean = false) {
  if (activePollingIds.has(id)) {
    if (immediate) queueLeaderboardPolling(id, 0)
    return
  }
  activePollingIds.add(id)
  queueLeaderboardPolling(id, immediate ? 0 : 3000)
}

function syncLeaderboardPolling(records: LeaderboardRecord[]) {
  const runningIds = new Set<number>()
  records.forEach((item) => {
    if (isActiveRecord(item.status)) {
      runningIds.add(item.id)
      ensureLeaderboardPolling(item.id)
    }
  })
  Array.from(activePollingIds).forEach((id) => {
    if (!runningIds.has(id)) stopLeaderboardPolling(id)
  })
}

const filteredLeaderboards = computed(() => {
  let list = [...leaderboards.value]
  if (search.value.trim()) {
    const keyword = search.value.trim().toLowerCase()
    list = list.filter((item) => item.name.toLowerCase().includes(keyword))
  }
  return list.sort((a, b) => b.id - a.id)
})

const pagedLeaderboards = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredLeaderboards.value.slice(start, start + pageSize.value)
})

watch(search, () => {
  page.value = 1
})

watch([filteredLeaderboards, pageSize], () => {
  const maxPage = Math.max(1, Math.ceil(filteredLeaderboards.value.length / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

watch(selectedAlgorithmTypeId, async () => {
  page.value = 1
  await fetchLeaderboards()
})

async function fetchLeaderboards(showLoading: boolean = true) {
  if (showLoading) loading.value = true
  errorMessage.value = ''
  try {
    const params =
      selectedAlgorithmTypeId.value === '__all__'
        ? undefined
        : { algorithm_type_id: selectedAlgorithmTypeId.value }
    const res = await listLeaderboard(params)
    const data = getDataOrThrow<any[]>(res, t('Leaderboard.Message.LoadFailed'))
    leaderboards.value = (data || []).map((item) => normalizeLeaderboard(item as Record<string, any>))
    syncLeaderboardPolling(leaderboards.value)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, t('Leaderboard.Message.LoadFailed'))
    ElMessage.error(errorMessage.value)
  } finally {
    if (showLoading) loading.value = false
  }
}

async function fetchCreateOptions() {
  const [typesRes, datasetsRes, runsRes] = await Promise.all([
    listAlgorithmType(),
    queryDataset(),
    listAvailableTrainRuns()
  ])
  algorithmTypes.value = normalizeAlgorithmTypes(
    getDataOrThrow<ListAlgorithmTypeRes>(typesRes, t('Leaderboard.Message.LoadFailed')) || []
  )
  datasets.value = getDataOrThrow<QueryDatasetResItem[]>(datasetsRes, t('Leaderboard.Message.LoadFailed')) || []
  availableTrainRuns.value = (
    getDataOrThrow<any[]>(runsRes, t('Leaderboard.Message.AvailableRunsFailed')) || []
  ).map((item) => normalizeAvailableTrainRun(item as Record<string, any>))
}

async function initialize() {
  loading.value = true
  errorMessage.value = ''
  try {
    await Promise.all([fetchLeaderboards(false), fetchCreateOptions()])
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, t('Leaderboard.Message.LoadFailed'))
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

async function handleCreate(payload: CreateLeaderboardPayload) {
  creating.value = true
  try {
    const res = await createLeaderboard(payload)
    getDataOrThrow(res, t('Leaderboard.Message.CreateFailed'))
    createVisible.value = false
    ElMessage.success(t('Leaderboard.Message.CreateSuccess'))
    await fetchLeaderboards(false)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.CreateFailed')))
  } finally {
    creating.value = false
  }
}

async function handleDelete(row: LeaderboardRecord) {
  if (deletingIds.value.includes(row.id)) return

  try {
    await ElMessageBox.confirm(
      t('Leaderboard.Confirm.DeleteContent', { name: row.name, id: row.id }),
      t('Leaderboard.Confirm.DeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('Leaderboard.Actions.Delete'),
        cancelButtonText: t('Leaderboard.Actions.Close')
      }
    )
  } catch (action) {
    if (action === 'cancel' || action === 'close') return
    throw action
  }

  deletingIds.value.push(row.id)
  try {
    const res = await deleteLeaderboard({ leaderboard_record_id: row.id })
    getDataOrThrow(res, t('Leaderboard.Message.DeleteFailed'))

    stopLeaderboardPolling(row.id)

    leaderboards.value = leaderboards.value.filter((item) => item.id !== row.id)

    if (detailData.value?.id === row.id) {
      detailVisible.value = false
      detailData.value = null
    }

    ElMessage.success(t('Leaderboard.Message.DeleteSuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.DeleteFailed')))
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== row.id)
  }
}

async function handleDetail(row: LeaderboardRecord) {
  detailVisible.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    detailData.value = await refreshLeaderboardDetail(row.id)
    if (isActiveRecord(detailData.value.status)) {
      ensureLeaderboardPolling(row.id)
    }
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.DetailFailed')))
  } finally {
    detailLoading.value = false
  }
}

async function handleItemRerun(item: LeaderboardItem) {
  if (rerunningIds.value.includes(item.item_id)) return

  try {
    await ElMessageBox.confirm(
      t('Leaderboard.Confirm.RerunItemContent', { id: item.item_id, name: item.algorithm_name }),
      t('Leaderboard.Confirm.RerunItemTitle'),
      {
        type: 'warning',
        confirmButtonText: t('Leaderboard.Actions.Rerun'),
        cancelButtonText: t('Leaderboard.Actions.Close')
      }
    )
  } catch (_) {
    return
  }

  rerunningIds.value.push(item.item_id)
  try {
    const rerunRes = await rerunLeaderboardItem({ item_id: item.item_id })
    getDataOrThrow(rerunRes, t('Leaderboard.Message.RerunFailed'))
    ElMessage.success(t('Leaderboard.Message.RerunSuccess'))
    if (detailData.value?.id) {
      await refreshLeaderboardDetail(detailData.value.id)
      ensureLeaderboardPolling(detailData.value.id, true)
    }
    await fetchLeaderboards(false)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.RerunFailed')))
  } finally {
    rerunningIds.value = rerunningIds.value.filter((id) => id !== item.item_id)
  }
}

async function handleItemDelete(item: LeaderboardItem) {
  if (deletingItemIds.value.includes(item.item_id)) return

  try {
    await ElMessageBox.confirm(
      t('Leaderboard.Confirm.DeleteItemContent', { id: item.item_id, name: item.algorithm_name }),
      t('Leaderboard.Confirm.DeleteItemTitle'),
      {
        type: 'warning',
        confirmButtonText: t('Leaderboard.Actions.DeleteItem'),
        cancelButtonText: t('Leaderboard.Actions.Close')
      }
    )
  } catch (_) {
    return
  }

  deletingItemIds.value.push(item.item_id)
  try {
    const res = await deleteLeaderboardItem({ item_id: item.item_id })
    getDataOrThrow(res, t('Leaderboard.Message.DeleteItemFailed'))
    ElMessage.success(t('Leaderboard.Message.DeleteItemSuccess'))
    if (detailData.value?.id) {
      await refreshLeaderboardDetail(detailData.value.id)
      if (isActiveRecord(detailData.value.status)) {
        ensureLeaderboardPolling(detailData.value.id)
      }
    }
    await fetchLeaderboards(false)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.DeleteItemFailed')))
  } finally {
    deletingItemIds.value = deletingItemIds.value.filter((id) => id !== item.item_id)
  }
}

async function handleToggleVisibility(row: LeaderboardRecord | LeaderboardDetail) {
  if (!row.is_owner || togglingVisibilityIds.value.includes(row.id)) return

  togglingVisibilityIds.value.push(row.id)
  try {
    const res = await toggleLeaderboardVisibility({ leaderboard_record_id: row.id })
    const data = getDataOrThrow<{
      leaderboard_record_id: number
      visibility: boolean
      updated_at?: string
    }>(res, t('Leaderboard.Message.ToggleVisibilityFailed'))
    updateLeaderboardVisibility(row.id, Boolean(data.visibility), data.updated_at)
    ElMessage.success(t('Leaderboard.Message.ToggleVisibilitySuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Leaderboard.Message.ToggleVisibilityFailed')))
  } finally {
    togglingVisibilityIds.value = togglingVisibilityIds.value.filter((id) => id !== row.id)
  }
}

onMounted(() => {
  void initialize()
})

onBeforeUnmount(() => {
  Array.from(activePollingIds).forEach((id) => stopLeaderboardPolling(id))
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6">
    <section class="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold text-slate-900">
            {{ t('Leaderboard.Title') }}
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-500">
            {{ t('Leaderboard.Description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <el-button
            type="primary"
            @click="createVisible = true"
          >
            {{ t('Leaderboard.Actions.Create') }}
          </el-button>
          <el-button
            plain
            :loading="loading"
            @click="fetchLeaderboards()"
          >
            {{ t('Leaderboard.Actions.Refresh') }}
          </el-button>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <el-select v-model="selectedAlgorithmTypeId">
            <el-option :label="t('Leaderboard.Filter.All')" value="__all__" />
            <el-option
              v-for="item in algorithmTypes"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-input
            v-model="search"
            clearable
            :placeholder="t('Leaderboard.Filter.Search')"
          />
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        class="mb-4"
        type="error"
        :closable="false"
        :title="errorMessage"
      />

      <el-empty
        v-if="!loading && filteredLeaderboards.length === 0"
        :description="t('Leaderboard.Empty')"
      />

      <el-table
        v-else
        v-loading="loading"
        :data="pagedLeaderboards"
        style="width: 100%"
      >
        <el-table-column prop="id" :label="t('Leaderboard.Table.Id')" min-width="80" />
        <el-table-column prop="name" :label="t('Leaderboard.Table.Name')" min-width="220" />
        <el-table-column
          prop="algorithm_type_name"
          :label="t('Leaderboard.Table.AlgorithmType')"
          min-width="160"
        />
        <el-table-column prop="dataset_name" :label="t('Leaderboard.Table.DatasetName')" min-width="160" />
        <el-table-column prop="run_count" :label="t('Leaderboard.Table.RunCount')" min-width="110" />
        <el-table-column :label="t('Leaderboard.Table.Status')" min-width="120">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag :type="statusTagType(row.status)">
                {{ formatStatus(row.status) }}
              </el-tag>
              <el-icon
                v-if="isActiveRecord(row.status)"
                class="is-loading text-amber-500"
              >
                <Loading />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('Leaderboard.Table.Visibility')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.visibility ? 'success' : 'info'" effect="plain">
              {{ row.visibility ? t('Leaderboard.Visibility.Public') : t('Leaderboard.Visibility.Private') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" :label="t('Leaderboard.Table.OwnerName')" min-width="140" />
        <el-table-column :label="t('Leaderboard.Table.CreatedAt')" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('Leaderboard.Table.UpdatedAt')" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('Leaderboard.Table.Actions')" min-width="180" fixed="right">
          <template #default="{ row }">
            <div class="flex flex-wrap items-center gap-3">
              <el-button size="small" plain @click="handleDetail(row)">
                {{ t('Leaderboard.Actions.Detail') }}
              </el-button>
              <el-button
                v-if="row.is_owner"
                size="small"
                plain
                :loading="togglingVisibilityIds.includes(row.id)"
                @click="handleToggleVisibility(row)"
              >
                {{ row.visibility ? t('Leaderboard.Actions.SetPrivate') : t('Leaderboard.Actions.SetPublic') }}
              </el-button>
              <el-button
                v-if="row.is_owner"
                size="small"
                type="danger"
                plain
                :loading="deletingIds.includes(row.id)"
                @click="handleDelete(row)"
              >
                {{ t('Leaderboard.Actions.Delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="filteredLeaderboards.length"
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </section>

    <CreateDialog
      v-model="createVisible"
      :submitting="creating"
      :algorithm-types="algorithmTypes"
      :datasets="datasets"
      :available-train-runs="availableTrainRuns"
      @submit="handleCreate"
    />

    <DetailDrawer
      v-model="detailVisible"
      :loading="detailLoading"
      :detail="detailData"
      :is-owner="detailData?.is_owner"
      :toggling-visibility="detailData ? togglingVisibilityIds.includes(detailData.id) : false"
      :deleting-item-ids="deletingItemIds"
      :rerunning-ids="rerunningIds"
      @toggle-visibility="detailData && handleToggleVisibility(detailData)"
      @rerun="handleItemRerun"
      @delete="handleItemDelete"
    />
  </div>
</template>
