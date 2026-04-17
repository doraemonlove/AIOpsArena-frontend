<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { localGet } from '@/core/madison/utils'
import { Login } from '@/core/madison-addon-login'
import type {
  AlgorithmItem,
  AlgorithmTypeItem,
  GetRunLogRes,
  ListAlgorithmTypeRes,
  RunAlgorithmOptions,
  RunAlgorithmRes,
  TrainRunDetail,
  TrainRunItem,
  TrainRunStatus
} from '@/core/madison-addon-algorithm-manager'
import {
  cancelRun,
  deleteAlgorithmRun,
  getRunDetail,
  getRunLog,
  listAlgorithm,
  listAlgorithmType,
  listTrainRuns,
  runAlgorithm
} from '@/core/madison-addon-algorithm-manager'
import { queryDataset } from '@/core/madison-addon-dataset/core/api'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'
import CreateDialog from './create-dialog.vue'
import DetailDrawer from './detail-drawer.vue'

const { t } = useI18n()
const currentLoginKey = localGet(Login.LOGIN_KEY, '') || ''

const loading = ref(false)
const creating = ref(false)
const createVisible = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<TrainRunDetail | null>(null)
const logLoading = ref(false)
const logContent = ref('')

const runs = ref<TrainRunItem[]>([])
const algorithmOptions = ref<AlgorithmItem[]>([])
const algorithmTypes = ref<string[]>([])
const datasetOptions = ref<QueryDatasetResItem[]>([])
const deletingIds = ref<number[]>([])
const cancelingIds = ref<number[]>([])
const rerunningIds = ref<number[]>([])
const search = ref('')
const statusFilter = ref('__all__')
const typeFilter = ref('__all__')

const pollingTimers = new Map<number, number>()
const statusOptions = ['waiting', 'starting', 'running', 'finished', 'failed', 'canceled']

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

function normalizeAlgorithmType(item: string | AlgorithmTypeItem) {
  if (typeof item === 'string') return item
  return item.algorithm_type || item.name || ''
}

function normalizeRun(item: Record<string, any>): TrainRunItem {
  return {
    id: Number(item.id ?? 0),
    template_id: Number(item.template_id ?? 0),
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type: item.algorithm_type ?? '',
    algorithm_deleted: Boolean(item.algorithm_deleted),
    algorithm_visibility:
      item.algorithm_visibility === true ||
      item.algorithm_visibility === 'True' ||
      item.algorithm_visibility === 'true',
    owner_id: item.owner_id !== undefined ? Number(item.owner_id) : undefined,
    owner_name: item.owner_name ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : null,
    dataset_name: item.dataset_name ?? '',
    mode: item.mode ?? 'train',
    status: (item.status ?? 'waiting') as TrainRunStatus,
    evaluation_status: item.evaluation_status ?? null,
    exit_code: item.exit_code ?? null,
    error_message: item.error_message ?? null,
    artifacts_path: item.artifacts_path ?? null,
    log_path: item.log_path ?? null,
    config_json: item.config_json ?? null,
    created_at: item.created_at ?? '',
    started_at: item.started_at ?? null,
    finished_at: item.finished_at ?? null
  }
}

function normalizeAlgorithm(item: Record<string, any>): AlgorithmItem {
  return {
    template_id: Number(item.template_id ?? item.id ?? 0),
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type: item.algorithm_type ?? '',
    description: item.description ?? '',
    owner_name: item.owner_name ?? item.create_person ?? '',
    visibility: item.visibility === true || item.visibility === 'True' || item.visibility === 'true',
    status: item.status ?? 'failed',
    image_status: item.image_status ?? 'not_built',
    created_at: item.created_at ?? item.create_time ?? '',
    dataset_type: item.dataset_type
  }
}

function extractRunId(data: RunAlgorithmRes) {
  if (typeof data === 'number') return data
  if (typeof data === 'string') return Number(data)
  if (typeof data.data === 'object' && data.data !== null && 'run_id' in data.data) {
    return Number((data.data as Record<string, any>).run_id ?? 0)
  }
  return Number(data.run_id ?? data.id ?? data.data ?? 0)
}

function isActive(status: TrainRunStatus) {
  return ['waiting', 'starting', 'running'].includes(status)
}

function stopRunPolling(id: number) {
  const timer = pollingTimers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    pollingTimers.delete(id)
  }
}

function upsertRun(item: TrainRunItem) {
  const index = runs.value.findIndex((run) => run.id === item.id)
  if (index === -1) {
    runs.value = [item, ...runs.value]
    return
  }
  runs.value[index] = item
  if (detailData.value?.id === item.id) {
    detailData.value = {
      ...detailData.value,
      ...item
    }
  }
}

async function fetchRuns(showLoading: boolean = true) {
  if (showLoading) loading.value = true
  try {
    const res = await listTrainRuns()
    const data = getDataOrThrow<any[]>(res, t('TrainRuns.Message.LoadFailed'))
    runs.value = (data || []).map((item) => normalizeRun(item as Record<string, any>))
    runs.value.forEach((item) => {
      if (isActive(item.status)) scheduleRunPolling(item.id)
    })
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.LoadFailed')))
  } finally {
    if (showLoading) loading.value = false
  }
}

async function fetchCreateOptions() {
  const [algorithmRes, typeRes, datasetRes] = await Promise.all([
    listAlgorithm(),
    listAlgorithmType(),
    queryDataset()
  ])
  algorithmOptions.value = (getDataOrThrow<any[]>(algorithmRes, t('TrainRuns.Message.LoadFailed')) || []).map((item) =>
    normalizeAlgorithm(item as Record<string, any>)
  )
  algorithmTypes.value = [...new Set((getDataOrThrow<ListAlgorithmTypeRes>(typeRes, t('TrainRuns.Message.LoadFailed')) || []).map(normalizeAlgorithmType).filter(Boolean))]
  datasetOptions.value = (getDataOrThrow<QueryDatasetResItem[]>(datasetRes, t('TrainRuns.Message.LoadFailed')) || []).map((item) => item as QueryDatasetResItem)
}

async function initialize() {
  loading.value = true
  try {
    await Promise.all([fetchRuns(false), fetchCreateOptions()])
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.LoadFailed')))
  } finally {
    loading.value = false
  }
}

function scheduleRunPolling(id: number) {
  stopRunPolling(id)
  const execute = async () => {
    try {
      const res = await getRunDetail(id)
      const detail = normalizeRun(getDataOrThrow<Record<string, any>>(res, t('TrainRuns.Message.DetailFailed')))
      upsertRun(detail)
      if (!isActive(detail.status)) {
        stopRunPolling(id)
        await fetchRuns(false)
        return
      }
      const timer = window.setTimeout(execute, 3000)
      pollingTimers.set(id, timer)
    } catch (_) {
      stopRunPolling(id)
    }
  }
  void execute()
}

const visibleAlgorithms = computed(() => algorithmOptions.value)

const filteredRuns = computed(() => {
  let list = [...runs.value]
  if (typeFilter.value !== '__all__') {
    list = list.filter((item) => item.algorithm_type === typeFilter.value)
  }
  if (statusFilter.value !== '__all__') {
    list = list.filter((item) => item.status === statusFilter.value)
  }
  if (search.value.trim()) {
    const keyword = search.value.trim().toLowerCase()
    list = list.filter((item) =>
      item.algorithm_name.toLowerCase().includes(keyword) ||
      (item.dataset_name || '').toLowerCase().includes(keyword)
    )
  }
  return list.sort((a, b) => b.id - a.id)
})

const page = ref(1)
const pageSize = ref(10)

const pagedRuns = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRuns.value.slice(start, start + pageSize.value)
})

watch([search, statusFilter, typeFilter], () => {
  page.value = 1
})

watch([filteredRuns, pageSize], () => {
  const maxPage = Math.max(1, Math.ceil(filteredRuns.value.length / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

function formatStatus(status: string) {
  const key = `TrainRuns.StatusText.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function statusTagType(status: TrainRunStatus) {
  if (status === 'finished') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'canceled') return 'info'
  return 'warning'
}

function canCancel(item: TrainRunItem) {
  return isActive(item.status) && item.owner_name === currentLoginKey
}

function canDelete(item: TrainRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && item.owner_name === currentLoginKey
}

function canRerun(item: TrainRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && item.owner_name === currentLoginKey
}

function shortErrorMessage(value?: string | null) {
  if (!value) return '--'
  return value.length > 40 ? `${value.slice(0, 40)}...` : value
}

async function handleCreate(payload: RunAlgorithmOptions) {
  creating.value = true
  try {
    const res = await runAlgorithm(payload)
    const data = getDataOrThrow<RunAlgorithmRes>(res, t('TrainRuns.Message.CreateFailed'))
    const runId = extractRunId(data)
    createVisible.value = false
    ElMessage.success(t('TrainRuns.Message.CreateSuccess'))
    await fetchRuns(false)
    if (runId > 0) scheduleRunPolling(runId)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.CreateFailed')))
  } finally {
    creating.value = false
  }
}

async function handleDelete(item: TrainRunItem) {
  if (!canDelete(item)) {
    ElMessage.warning(t('TrainRuns.Message.PermissionDenied'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('TrainRuns.Confirm.DeleteContent', { id: item.id }),
      t('TrainRuns.Confirm.DeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('TrainRuns.Actions.Delete'),
        cancelButtonText: t('TrainRuns.Actions.Close')
      }
    )
  } catch (_) {
    return
  }

  deletingIds.value.push(item.id)
  try {
    const res = await deleteAlgorithmRun({ run_id: item.id })
    getDataOrThrow(res, t('TrainRuns.Message.DeleteFailed'))
    stopRunPolling(item.id)
    runs.value = runs.value.filter((run) => run.id !== item.id)
    ElMessage.success(t('TrainRuns.Message.DeleteSuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.DeleteFailed')))
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== item.id)
  }
}

async function handleCancel(item: TrainRunItem) {
  if (!canCancel(item)) {
    ElMessage.warning(t('TrainRuns.Message.PermissionDenied'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('TrainRuns.Confirm.CancelContent', { id: item.id }),
      t('TrainRuns.Confirm.CancelTitle'),
      {
        type: 'warning',
        confirmButtonText: t('TrainRuns.Confirm.Confirm'),
        cancelButtonText: t('TrainRuns.Confirm.Cancel')
      }
    )
  } catch (_) {
    return
  }

  cancelingIds.value.push(item.id)
  try {
    const res = await cancelRun({ run_id: item.id })
    getDataOrThrow(res, t('TrainRuns.Message.CancelFailed'))
    ElMessage.success(t('TrainRuns.Message.CancelSuccess'))
    if (detailData.value?.id === item.id) {
      detailData.value = {
        ...detailData.value,
        status: 'canceled'
      }
    }
    scheduleRunPolling(item.id)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.CancelFailed')))
  } finally {
    cancelingIds.value = cancelingIds.value.filter((id) => id !== item.id)
  }
}

async function handleRerun(item: TrainRunItem) {
  if (!canRerun(item)) {
    ElMessage.warning(t('TrainRuns.Message.PermissionDenied'))
    return
  }
  rerunningIds.value.push(item.id)
  try {
    const detailRes = await getRunDetail(item.id)
    const detail = getDataOrThrow<TrainRunDetail>(detailRes, t('TrainRuns.Message.RerunFailed'))
    const templateId = Number(detail.template_id ?? item.template_id ?? 0)
    const datasetId = Number(detail.dataset_id ?? item.dataset_id ?? 0)
    const algorithmConfig =
      detail.config_json && typeof detail.config_json === 'object' ? detail.config_json : {}

    const rerunRes = await runAlgorithm({
      template_id: templateId,
      mode: 'train',
      dataset_id: datasetId,
      algorithm_config: algorithmConfig
    })
    getDataOrThrow(rerunRes, t('TrainRuns.Message.RerunFailed'))

    ElMessage.success(t('TrainRuns.Message.RerunSuccess'))
    await fetchRuns(false)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.RerunFailed')))
  } finally {
    rerunningIds.value = rerunningIds.value.filter((id) => id !== item.id)
  }
}

async function handleDetail(item: TrainRunItem) {
  detailVisible.value = true
  detailLoading.value = true
  logLoading.value = true
  detailData.value = null
  logContent.value = ''
  try {
    const [detailRes, logRes] = await Promise.all([
      getRunDetail(item.id),
      getRunLog(item.id)
    ])
    detailData.value = getDataOrThrow<TrainRunDetail>(detailRes, t('TrainRuns.Message.DetailFailed'))
    logContent.value = parseLogContent(getDataOrThrow<GetRunLogRes>(logRes, t('TrainRuns.Message.LogFailed')))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TrainRuns.Message.DetailFailed')))
  } finally {
    detailLoading.value = false
    logLoading.value = false
  }
}

function parseLogContent(data: GetRunLogRes) {
  if (typeof data === 'string') return data
  return data.log || data.content || data.data || data.text || ''
}

onMounted(() => {
  void initialize()
})

onBeforeUnmount(() => {
  pollingTimers.forEach((timer) => window.clearTimeout(timer))
  pollingTimers.clear()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6">
    <section class="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold text-slate-900">
            {{ t('TrainRuns.Title') }}
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-500">
            {{ t('TrainRuns.Description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <el-button
            type="primary"
            @click="createVisible = true"
          >
            {{ t('TrainRuns.CreateTrain') }}
          </el-button>
          <el-button
            plain
            :loading="loading"
            @click="fetchRuns()"
          >
            {{ t('TrainRuns.Refresh') }}
          </el-button>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-slate-500">{{ t('TrainRuns.Filter.Type') }}</span>
          <el-tag
            :type="typeFilter === '__all__' ? 'primary' : 'info'"
            class="cursor-pointer"
            effect="plain"
            @click="typeFilter = '__all__'"
          >
            {{ t('TrainRuns.Filter.All') }}
          </el-tag>
          <el-tag
            v-for="type in algorithmTypes"
            :key="type"
            :type="typeFilter === type ? 'primary' : 'info'"
            class="cursor-pointer"
            effect="plain"
            @click="typeFilter = type"
          >
            {{ type }}
          </el-tag>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <el-select v-model="statusFilter">
            <el-option :label="t('TrainRuns.Filter.All')" value="__all__" />
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="formatStatus(status)"
              :value="status"
            />
          </el-select>
          <el-input
            v-model="search"
            :placeholder="t('TrainRuns.Filter.Search')"
            clearable
          />
        </div>
      </div>

      <el-empty
        v-if="!loading && filteredRuns.length === 0"
        :description="t('TrainRuns.Empty')"
      />

      <el-table
        v-else
        v-loading="loading"
        :data="pagedRuns"
        style="width: 100%"
      >
        <el-table-column prop="id" :label="t('TrainRuns.Table.Id')" min-width="80" />
        <el-table-column prop="algorithm_name" :label="t('TrainRuns.Table.AlgorithmName')" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <span>{{ row.algorithm_name }}</span>
              <el-tag
                v-if="row.algorithm_deleted"
                type="danger"
              >
                {{ t('TrainRuns.Deleted') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="algorithm_type" :label="t('TrainRuns.Table.AlgorithmType')" min-width="160" />
        <el-table-column prop="dataset_name" :label="t('TrainRuns.Table.DatasetName')" min-width="160" />
        <el-table-column prop="owner_name" :label="t('TrainRuns.Table.OwnerName')" min-width="140" />
        <el-table-column :label="t('TrainRuns.Table.Status')" min-width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag :type="statusTagType(row.status)">
                {{ formatStatus(row.status) }}
              </el-tag>
              <el-icon
                v-if="isActive(row.status)"
                class="is-loading text-amber-500"
              >
                <Loading />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('TrainRuns.Table.ErrorMessage')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'text-rose-500': row.status === 'failed' }">
              {{ shortErrorMessage(row.error_message) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('TrainRuns.Table.CreatedAt')" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('TrainRuns.Table.StartedAt')" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.started_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('TrainRuns.Table.FinishedAt')" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.finished_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('TrainRuns.Table.Actions')" min-width="280" fixed="right">
          <template #default="{ row }">
            <div class="flex flex-wrap items-center gap-3">
              <el-button size="small" plain @click="handleDetail(row)">
                {{ t('TrainRuns.Actions.Detail') }}
              </el-button>
              <el-button
                v-if="canRerun(row)"
                size="small"
                type="primary"
                plain
                :loading="rerunningIds.includes(row.id)"
                @click="handleRerun(row)"
              >
                {{ t('TrainRuns.Actions.Rerun') }}
              </el-button>
              <el-button
                v-if="canCancel(row)"
                size="small"
                type="warning"
                plain
                :loading="cancelingIds.includes(row.id)"
                @click="handleCancel(row)"
              >
                {{ t('TrainRuns.Actions.CancelTask') }}
              </el-button>
              <el-button
                v-if="canDelete(row)"
                size="small"
                type="danger"
                plain
                :loading="deletingIds.includes(row.id)"
                @click="handleDelete(row)"
              >
                {{ t('TrainRuns.Actions.Delete') }}
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
          :total="filteredRuns.length"
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </section>

    <CreateDialog
      v-model="createVisible"
      :submitting="creating"
      :algorithms="visibleAlgorithms"
      :algorithm-types="algorithmTypes"
      :datasets="datasetOptions"
      @submit="handleCreate"
    />
    <DetailDrawer
      v-model="detailVisible"
      :loading="detailLoading"
      :detail="detailData"
      :log-loading="logLoading"
      :log-content="logContent"
    />
  </div>
</template>
