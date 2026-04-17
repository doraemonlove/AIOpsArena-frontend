<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import Structure from '@/components/Structure/index.vue'
import { localGet } from '@/core/madison/utils'
import { Login } from '@/core/madison-addon-login'
import { queryDataset } from '@/core/madison-addon-dataset/core/api'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'
import {
  cancelRun,
  deleteAlgorithmRun,
  getRunDetail,
  getRunLog,
  listAvailableTrainRuns,
  listTestRuns,
  runTest
} from '@/core/madison-addon-algorithm-manager'
import type {
  AvailableTrainRunItem,
  ListAvailableTrainRunsRes,
  ListTestRunsRes,
  RunDetail,
  RunStatus,
  RunTestOptions as RunAlgorithmPayload,
  RunAlgorithmRes as RunAlgorithmResponse,
  GetRunLogRes as RunLogResponse,
  TestRunItem
} from '@/core/madison-addon-algorithm-manager'
import CreateTestDialog from '../components/CreateTestDialog.vue'
import RunDetailDrawer from '../components/RunDetailDrawer.vue'
import TestRunTable from '../components/TestRunTable.vue'

const { t } = useI18n()
const currentLoginKey = localGet(Login.LOGIN_KEY, '') || ''

const loading = ref(false)
const creating = ref(false)
const createVisible = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<RunDetail | null>(null)
const logLoading = ref(false)
const logContent = ref('')

const runs = ref<TestRunItem[]>([])
const availableTrainRuns = ref<AvailableTrainRunItem[]>([])
const datasets = ref<QueryDatasetResItem[]>([])
const algorithmTypes = ref<string[]>([])
const deletingIds = ref<number[]>([])
const cancelingIds = ref<number[]>([])
const rerunningIds = ref<number[]>([])

const pollingTimers = new Map<number, number>()

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

function normalizeRun(item: Record<string, any>): TestRunItem {
  return {
    id: Number(item.id ?? 0),
    template_id: Number(item.template_id ?? 0),
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type: item.algorithm_type ?? '',
    source_run_id:
      item.source_run_id !== undefined && item.source_run_id !== null ? Number(item.source_run_id) : null,
    algorithm_deleted: Boolean(item.algorithm_deleted),
    algorithm_visibility:
      item.algorithm_visibility === true ||
      item.algorithm_visibility === 'True' ||
      item.algorithm_visibility === 'true',
    owner_id: item.owner_id !== undefined ? Number(item.owner_id) : undefined,
    owner_name: item.owner_name ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : null,
    dataset_name: item.dataset_name ?? '',
    mode: item.mode ?? 'test',
    status: (item.status ?? 'waiting') as RunStatus,
    evaluation_status: item.evaluation_status ?? null,
    exit_code: item.exit_code ?? null,
    error_message: item.error_message ?? null,
    evaluation_error: item.evaluation_error ?? null,
    artifacts_path: item.artifacts_path ?? null,
    log_path: item.log_path ?? null,
    config_json: item.config_json ?? item.algorithm_config ?? null,
    algorithm_config: item.algorithm_config ?? item.config_json ?? null,
    result_json: item.result_json ?? null,
    metrics_json: item.metrics_json ?? null,
    created_at: item.created_at ?? '',
    started_at: item.started_at ?? null,
    finished_at: item.finished_at ?? null
  }
}

function normalizeAvailableTrainRun(item: Record<string, any>): AvailableTrainRunItem {
  return {
    id: Number(item.id ?? 0),
    template_id: Number(item.template_id ?? 0),
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type: item.algorithm_type ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : null,
    dataset_name: item.dataset_name ?? '',
    status: item.status ?? 'finished',
    created_at: item.created_at ?? '',
    finished_at: item.finished_at ?? null,
    checkpoint_path: item.checkpoint_path ?? null,
    checkpoints_path: item.checkpoints_path ?? null
  }
}

function extractRunId(data: RunAlgorithmResponse) {
  if (typeof data === 'number') return data
  if (typeof data === 'string') return Number(data)
  if (typeof data.data === 'object' && data.data !== null && 'run_id' in data.data) {
    return Number((data.data as Record<string, any>).run_id ?? 0)
  }
  return Number(data.run_id ?? data.id ?? data.data ?? 0)
}

function parseLogContent(data: RunLogResponse) {
  if (typeof data === 'string') return data
  return data.log || data.content || data.data || data.text || ''
}

function isActive(status: RunStatus) {
  return ['waiting', 'starting', 'running'].includes(status)
}

function isOwner(item: TestRunItem) {
  return Boolean(item.owner_name) && item.owner_name === currentLoginKey
}

function canCancel(item: TestRunItem) {
  return ['waiting', 'starting', 'running'].includes(item.status) && isOwner(item)
}

function canDelete(item: TestRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && isOwner(item)
}

function canRerun(item: TestRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && isOwner(item)
}

function upsertRun(item: TestRunItem) {
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

function stopRunPolling(id: number) {
  const timer = pollingTimers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    pollingTimers.delete(id)
  }
}

function scheduleRunPolling(id: number) {
  stopRunPolling(id)
  const execute = async () => {
    try {
      const res = await getRunDetail(id)
      const detail = normalizeRun(getDataOrThrow<Record<string, any>>(res, t('TestRuns.Message.DetailFailed')))
      upsertRun(detail)
      if (detailVisible.value && detailData.value?.id === id) {
        detailData.value = {
          ...(detailData.value || {}),
          ...detail
        }
      }
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

async function fetchRuns(showLoading: boolean = true) {
  if (showLoading) loading.value = true
  try {
    const res = await listTestRuns()
    const data = getDataOrThrow<ListTestRunsRes>(res, t('TestRuns.Message.LoadFailed'))
    runs.value = (data || []).map((item) => normalizeRun(item as Record<string, any>))
    runs.value.forEach((item) => {
      if (isActive(item.status)) scheduleRunPolling(item.id)
    })
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.LoadFailed')))
  } finally {
    if (showLoading) loading.value = false
  }
}

async function fetchCreateOptions() {
  const [trainRes, datasetRes] = await Promise.all([
    listAvailableTrainRuns(),
    queryDataset()
  ])
  availableTrainRuns.value = (getDataOrThrow<ListAvailableTrainRunsRes>(trainRes, t('TestRuns.Message.LoadFailed')) || [])
    .map((item) => normalizeAvailableTrainRun(item as Record<string, any>))
  datasets.value = (getDataOrThrow<QueryDatasetResItem[]>(datasetRes, t('TestRuns.Message.LoadFailed')) || [])
    .map((item) => item as QueryDatasetResItem)
  algorithmTypes.value = [...new Set(availableTrainRuns.value.map((item) => item.algorithm_type).filter(Boolean))]
}

async function initialize() {
  loading.value = true
  try {
    await Promise.all([fetchRuns(false), fetchCreateOptions()])
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.LoadFailed')))
  } finally {
    loading.value = false
  }
}

async function handleCreate(payload: RunAlgorithmPayload) {
  creating.value = true
  try {
    const res = await runTest(payload)
    const data = getDataOrThrow<RunAlgorithmResponse>(res, t('TestRuns.Message.CreateFailed'))
    const runId = extractRunId(data)
    createVisible.value = false
    ElMessage.success(t('TestRuns.Message.CreateSuccess'))
    await fetchRuns(false)
    if (runId > 0) scheduleRunPolling(runId)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.CreateFailed')))
  } finally {
    creating.value = false
  }
}

async function handleDelete(item: TestRunItem) {
  if (!canDelete(item)) {
    ElMessage.warning(t('TestRuns.Message.PermissionDenied'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('TestRuns.Confirm.DeleteContent', { id: item.id }),
      t('TestRuns.Confirm.DeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('TestRuns.Actions.Delete'),
        cancelButtonText: t('TestRuns.Actions.Close')
      }
    )
  } catch (_) {
    return
  }

  deletingIds.value.push(item.id)
  try {
    const res = await deleteAlgorithmRun({ run_id: item.id })
    getDataOrThrow(res, t('TestRuns.Message.DeleteFailed'))
    stopRunPolling(item.id)
    runs.value = runs.value.filter((run) => run.id !== item.id)
    ElMessage.success(t('TestRuns.Message.DeleteSuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.DeleteFailed')))
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== item.id)
  }
}

async function handleCancel(item: TestRunItem) {
  if (!canCancel(item)) {
    ElMessage.warning(t('TestRuns.Message.PermissionDenied'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('TestRuns.Confirm.CancelContent', { id: item.id }),
      t('TestRuns.Confirm.CancelTitle'),
      {
        type: 'warning',
        confirmButtonText: t('TestRuns.Confirm.Confirm'),
        cancelButtonText: t('TestRuns.Confirm.Cancel')
      }
    )
  } catch (_) {
    return
  }

  cancelingIds.value.push(item.id)
  try {
    const res = await cancelRun({ run_id: item.id })
    getDataOrThrow(res, t('TestRuns.Message.CancelFailed'))
    ElMessage.success(t('TestRuns.Message.CancelSuccess'))
    if (detailData.value?.id === item.id) {
      detailData.value = {
        ...detailData.value,
        status: 'canceled'
      }
    }
    scheduleRunPolling(item.id)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.CancelFailed')))
  } finally {
    cancelingIds.value = cancelingIds.value.filter((id) => id !== item.id)
  }
}

async function handleRerun(item: TestRunItem) {
  if (!canRerun(item)) {
    ElMessage.warning(t('TestRuns.Message.PermissionDenied'))
    return
  }
  rerunningIds.value.push(item.id)
  try {
    const detailRes = await getRunDetail(item.id)
    const detail = getDataOrThrow<RunDetail>(detailRes, t('TestRuns.Message.RerunFailed'))
    const templateId = Number(detail.template_id ?? item.template_id ?? 0)
    const datasetId = Number(detail.dataset_id ?? item.dataset_id ?? 0)
    const sourceRunId = Number(detail.source_run_id ?? item.source_run_id ?? 0)
    const algorithmConfig =
      detail.algorithm_config && typeof detail.algorithm_config === 'object'
        ? detail.algorithm_config
        : detail.config_json && typeof detail.config_json === 'object'
          ? detail.config_json
          : {}

    const rerunRes = await runTest({
      template_id: templateId,
      mode: 'test',
      dataset_id: datasetId,
      source_run_id: sourceRunId,
      algorithm_config: algorithmConfig
    })
    const rerunData = getDataOrThrow<RunAlgorithmResponse>(rerunRes, t('TestRuns.Message.RerunFailed'))
    const runId = extractRunId(rerunData)

    ElMessage.success(t('TestRuns.Message.RerunSuccess'))
    await fetchRuns(false)
    if (runId > 0) scheduleRunPolling(runId)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.RerunFailed')))
  } finally {
    rerunningIds.value = rerunningIds.value.filter((id) => id !== item.id)
  }
}

async function handleDetail(item: TestRunItem) {
  detailVisible.value = true
  detailLoading.value = true
  logLoading.value = true
  detailData.value = null
  logContent.value = ''
  const [detailRes, logRes] = await Promise.allSettled([
    getRunDetail(item.id),
    getRunLog(item.id)
  ])

  if (detailRes.status === 'fulfilled') {
    try {
      const detail = getDataOrThrow<RunDetail>(detailRes.value, t('TestRuns.Message.DetailFailed'))
      detailData.value = {
        ...detail,
        ...normalizeRun(detail as Record<string, any>)
      }
    } catch (error) {
      ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.DetailFailed')))
    }
  } else {
    ElMessage.error(extractErrorMessage(detailRes.reason, t('TestRuns.Message.DetailFailed')))
  }

  if (logRes.status === 'fulfilled') {
    try {
      logContent.value = parseLogContent(getDataOrThrow<RunLogResponse>(logRes.value, t('TestRuns.Message.LogFailed')))
    } catch (error) {
      ElMessage.error(extractErrorMessage(error, t('TestRuns.Message.LogFailed')))
    }
  } else {
    ElMessage.error(extractErrorMessage(logRes.reason, t('TestRuns.Message.LogFailed')))
  }

  detailLoading.value = false
  logLoading.value = false
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
  <Structure>
    <template #main>
      <div class="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6">
        <section class="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="text-3xl font-semibold text-slate-900">
                {{ t('TestRuns.Title') }}
              </h1>
              <p class="max-w-2xl text-sm leading-6 text-slate-500">
                {{ t('TestRuns.Description') }}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <el-button
                type="primary"
                @click="createVisible = true"
              >
                {{ t('TestRuns.CreateTest') }}
              </el-button>
              <el-button
                plain
                :loading="loading"
                @click="fetchRuns()"
              >
                {{ t('TestRuns.Refresh') }}
              </el-button>
            </div>
          </div>
        </section>

        <TestRunTable
          :items="runs"
          :loading="loading"
          :deleting-ids="deletingIds"
          :canceling-ids="cancelingIds"
          :rerunning-ids="rerunningIds"
          :algorithm-types="algorithmTypes"
          @detail="handleDetail"
          @rerun="handleRerun"
          @cancel="handleCancel"
          @delete="handleDelete"
        />

        <CreateTestDialog
          v-model="createVisible"
          :submitting="creating"
          :available-train-runs="availableTrainRuns"
          :datasets="datasets"
          :algorithm-types="algorithmTypes"
          @submit="handleCreate"
        />

        <RunDetailDrawer
          v-model="detailVisible"
          :loading="detailLoading"
          :detail="detailData"
          :log-loading="logLoading"
          :log-content="logContent"
        />
      </div>
    </template>
  </Structure>
</template>
