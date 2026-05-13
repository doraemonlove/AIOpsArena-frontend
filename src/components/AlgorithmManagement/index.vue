<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { localGet } from '@/core/madison/utils'
import { Login } from '@/core/madison-addon-login'
import type {
  AlgorithmImageStatus,
  AlgorithmImportStatus,
  AlgorithmItem,
  AlgorithmTypeItem,
  ImportAlgorithmOptions,
  ImportAlgorithmRes,
  ListAlgorithmTypeRes
} from '@/core/madison-addon-algorithm-manager'
import {
  buildAlgorithmImage,
  downloadAlgorithmTemplate,
  deleteAlgorithm,
  getBuildAlgorithmImageStatus,
  getImportAlgorithmStatus,
  importAlgorithm,
  listAlgorithm,
  listAlgorithmType,
  toggleAlgorithmVisibility
} from '@/core/madison-addon-algorithm-manager'
import UploadDialog from './upload-dialog.vue'
import AlgorithmSection from './section.vue'

type PollKind = 'import' | 'image'
const { t } = useI18n()
const currentLoginKey = localGet(Login.LOGIN_KEY, '') || ''

const loading = ref(false)
const uploading = ref(false)
const uploadDialogVisible = ref(false)
const algorithmTypes = ref<Array<{ id: string, name: string }>>([])
const algorithms = ref<AlgorithmItem[]>([])
const buildingIds = ref<number[]>([])
const deletingIds = ref<number[]>([])
const togglingIds = ref<number[]>([])
const pollingTimers = new Map<string, number>()

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
  if (typeof item === 'string') {
    return {
      id: item,
      name: item
    }
  }
  const name = item.algorithm_type || item.name || ''
  const id = item.id !== undefined ? String(item.id) : name
  return {
    id,
    name
  }
}

function normalizeAlgorithmTypes(data: ListAlgorithmTypeRes) {
  const normalized = data
    .map(normalizeAlgorithmType)
    .filter((item) => !!item.name)
  const map = new Map<string, { id: string, name: string }>()
  normalized.forEach((item) => {
    map.set(item.id, item)
  })
  return Array.from(map.values())
}

function normalizeAlgorithmItem(item: Record<string, any>): AlgorithmItem {
  return {
    template_id: Number(item.template_id ?? item.id ?? 0),
    algorithm_name: item.algorithm_name ?? '',
    algorithm_type: item.algorithm_type ?? 'Unknown',
    algorithm_type_id:
      item.algorithm_type_id !== undefined && item.algorithm_type_id !== null
        ? Number(item.algorithm_type_id)
        : null,
    description: item.description ?? '',
    owner_id: item.owner_id !== undefined && item.owner_id !== null ? Number(item.owner_id) : null,
    owner_name: item.owner_name ?? item.create_person ?? '',
    visibility: item.visibility === true || item.visibility === 'True' || item.visibility === 'true',
    status: (item.status ?? 'failed') as AlgorithmImportStatus,
    image_status: (item.image_status ?? 'not_built') as AlgorithmImageStatus,
    created_at: item.created_at ?? item.create_time ?? '',
    dataset_type: item.dataset_type
  }
}

function extractTemplateId(data: ImportAlgorithmRes) {
  if (typeof data === 'number') return data
  if (typeof data === 'string') return Number(data)
  return Number(data.template_id ?? data.id ?? data.data ?? 0)
}

function upsertAlgorithm(partial: Partial<AlgorithmItem> & { template_id: number }) {
  const index = algorithms.value.findIndex((item) => item.template_id === partial.template_id)
  if (index === -1) return
  algorithms.value[index] = {
    ...algorithms.value[index],
    ...partial
  }
}

function isOwner(item: AlgorithmItem) {
  return Boolean(item.owner_name) && item.owner_name === currentLoginKey
}

function sortAlgorithms(list: AlgorithmItem[]) {
  const preferredOrder = algorithmTypes.value.map((item) => item.name)
  return [...list].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.algorithm_type)
    const bIndex = preferredOrder.indexOf(b.algorithm_type)
    if (aIndex !== bIndex) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return b.template_id - a.template_id
  })
}

const publicItems = computed(() => sortAlgorithms(algorithms.value.filter((item) => item.visibility)))
const privateItems = computed(() => sortAlgorithms(algorithms.value.filter((item) => !item.visibility)))

function pollKey(kind: PollKind, templateId: number) {
  return `${kind}:${templateId}`
}

function stopPolling(kind: PollKind, templateId: number) {
  const key = pollKey(kind, templateId)
  const timer = pollingTimers.get(key)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    pollingTimers.delete(key)
  }
}

function scheduleImportStatusPolling(templateId: number) {
  stopPolling('import', templateId)
  const execute = async () => {
    try {
      const res = await getImportAlgorithmStatus(templateId)
      const data = getDataOrThrow<{ status?: string }>(res, t('Algorithm.Message.FetchImportStatusFailed'))
      const status = data?.status || 'failed'
      upsertAlgorithm({
        template_id: templateId,
        status
      })
      if (status === 'ready' || status === 'failed') {
        stopPolling('import', templateId)
        await fetchAlgorithms(false)
        return
      }
      const timer = window.setTimeout(execute, 2000)
      pollingTimers.set(pollKey('import', templateId), timer)
    } catch (error) {
      stopPolling('import', templateId)
      ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.FetchImportStatusFailed')))
    }
  }
  void execute()
}

function scheduleImageStatusPolling(templateId: number) {
  stopPolling('image', templateId)
  const execute = async () => {
    try {
      const res = await getBuildAlgorithmImageStatus(templateId)
      const data = getDataOrThrow<{ image_status?: string }>(res, t('Algorithm.Message.FetchImageStatusFailed'))
      const imageStatus = data?.image_status || 'failed'
      upsertAlgorithm({
        template_id: templateId,
        image_status: imageStatus
      })
      if (imageStatus === 'ready' || imageStatus === 'failed') {
        stopPolling('image', templateId)
        buildingIds.value = buildingIds.value.filter((id) => id !== templateId)
        await fetchAlgorithms(false)
        return
      }
      const timer = window.setTimeout(execute, 2000)
      pollingTimers.set(pollKey('image', templateId), timer)
    } catch (error) {
      stopPolling('image', templateId)
      buildingIds.value = buildingIds.value.filter((id) => id !== templateId)
      ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.FetchImageStatusFailed')))
    }
  }
  void execute()
}

async function fetchAlgorithmTypes() {
  const res = await listAlgorithmType()
  algorithmTypes.value = normalizeAlgorithmTypes(getDataOrThrow<ListAlgorithmTypeRes>(res, t('Algorithm.Message.LoadFailed')) || [])
}

async function fetchAlgorithms(showLoading: boolean = true) {
  if (showLoading) loading.value = true
  try {
    const res = await listAlgorithm()
    const data = getDataOrThrow<any[]>(res, t('Algorithm.Message.LoadFailed'))
    algorithms.value = (data || []).map((item) => normalizeAlgorithmItem(item as Record<string, any>))
    buildingIds.value = algorithms.value
      .filter((item) => item.image_status === 'building')
      .map((item) => item.template_id)
    algorithms.value.forEach((item) => {
      if (item.status === 'importing') scheduleImportStatusPolling(item.template_id)
      if (item.image_status === 'building') {
        scheduleImageStatusPolling(item.template_id)
      }
    })
  } finally {
    if (showLoading) loading.value = false
  }
}

async function initialize() {
  loading.value = true
  try {
    await Promise.all([fetchAlgorithmTypes(), fetchAlgorithms(false)])
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.LoadFailed')))
  } finally {
    loading.value = false
  }
}

async function handleUpload(payload: ImportAlgorithmOptions) {
  uploading.value = true
  try {
    const res = await importAlgorithm(payload)
    const data = getDataOrThrow<ImportAlgorithmRes>(res, t('Algorithm.Message.UploadFailed'))
    const templateId = extractTemplateId(data)
    uploadDialogVisible.value = false
    ElMessage.success(t('Algorithm.Message.UploadStarted'))
    await fetchAlgorithms(false)
    if (templateId > 0) {
      upsertAlgorithm({
        template_id: templateId,
        status: 'importing'
      })
      scheduleImportStatusPolling(templateId)
    }
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.UploadFailed')))
  } finally {
    uploading.value = false
  }
}

async function handleBuild(item: AlgorithmItem) {
  if (!isOwner(item)) {
    ElMessage.warning(t('Algorithm.Message.PermissionDenied'))
    return
  }
  if (!buildingIds.value.includes(item.template_id)) {
    buildingIds.value.push(item.template_id)
  }
  try {
    const res = await buildAlgorithmImage({
      template_id: item.template_id
    })
    getDataOrThrow(res, t('Algorithm.Message.BuildFailed'))
    upsertAlgorithm({
      template_id: item.template_id,
      image_status: 'building'
    })
    ElMessage.success(t('Algorithm.Message.BuildStarted'))
    scheduleImageStatusPolling(item.template_id)
  } catch (error) {
    buildingIds.value = buildingIds.value.filter((id) => id !== item.template_id)
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.BuildFailed')))
  }
}

async function handleDelete(item: AlgorithmItem) {
  if (!isOwner(item)) {
    ElMessage.warning(t('Algorithm.Message.PermissionDenied'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('Algorithm.DeleteDialog.Content', { name: item.algorithm_name }),
      t('Algorithm.DeleteDialog.Title'),
      {
        type: 'warning',
        confirmButtonText: t('Algorithm.DeleteDialog.Confirm'),
        cancelButtonText: t('Algorithm.DeleteDialog.Cancel')
      }
    )
  } catch (_) {
    return
  }
  deletingIds.value.push(item.template_id)
  try {
    const res = await deleteAlgorithm({
      template_id: item.template_id
    })
    getDataOrThrow(res, t('Algorithm.Message.DeleteFailed'))
    stopPolling('import', item.template_id)
    stopPolling('image', item.template_id)
    algorithms.value = algorithms.value.filter((algorithm) => algorithm.template_id !== item.template_id)
    ElMessage.success(t('Algorithm.Message.DeleteSuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.DeleteFailed')))
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== item.template_id)
  }
}

async function handleToggleVisibility(item: AlgorithmItem) {
  if (!isOwner(item)) {
    ElMessage.warning(t('Algorithm.Message.PermissionDenied'))
    return
  }
  togglingIds.value.push(item.template_id)
  try {
    const res = await toggleAlgorithmVisibility({
      template_id: item.template_id
    })
    const data = getDataOrThrow<{ visibility?: boolean }>(res, t('Algorithm.Message.ToggleVisibilityFailed'))
    const visibility = data?.visibility
    if (typeof visibility === 'boolean') {
      upsertAlgorithm({
        template_id: item.template_id,
        visibility
      })
    } else {
      await fetchAlgorithms(false)
    }
    ElMessage.success(t('Algorithm.Message.ToggleVisibilitySuccess'))
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.ToggleVisibilityFailed')))
  } finally {
    togglingIds.value = togglingIds.value.filter((id) => id !== item.template_id)
  }
}

async function handleDownloadTemplate() {
  try {
    const res = await downloadAlgorithmTemplate()
    const blob = res?.data
    if (!(blob instanceof Blob)) {
      throw new Error(t('Algorithm.Message.DownloadTemplateFailed'))
    }
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'algorithm_template.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error(extractErrorMessage(error, t('Algorithm.Message.DownloadTemplateFailed')))
  }
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
            {{ t('Algorithm.Title') }}
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-500">
            {{ t('Algorithm.Description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <el-button
            type="primary"
            @click="uploadDialogVisible = true"
          >
            {{ t('Algorithm.UploadAlgorithm') }}
          </el-button>
          <el-button
            plain
            @click="handleDownloadTemplate"
          >
            {{ t('Algorithm.DownloadTemplate') }}
          </el-button>
          <el-button
            plain
            :loading="loading"
            @click="fetchAlgorithms()"
          >
            {{ t('Algorithm.Refresh') }}
          </el-button>
        </div>
      </div>
    </section>

    <div
      v-loading="loading"
      class="flex flex-col gap-6"
    >
      <AlgorithmSection
        :title="t('Algorithm.PublicAlgorithms')"
        :empty-text="t('Algorithm.NoPublicAlgorithms')"
        :items="publicItems"
        :building-ids="buildingIds"
        :deleting-ids="deletingIds"
        :toggling-ids="togglingIds"
        :algorithm-type-options="algorithmTypes.map((item) => item.name)"
        @build="handleBuild"
        @delete="handleDelete"
        @toggle-visibility="handleToggleVisibility"
      />
      <AlgorithmSection
        :title="t('Algorithm.PrivateAlgorithms')"
        :empty-text="t('Algorithm.NoPrivateAlgorithms')"
        :items="privateItems"
        :building-ids="buildingIds"
        :deleting-ids="deletingIds"
        :toggling-ids="togglingIds"
        :algorithm-type-options="algorithmTypes.map((item) => item.name)"
        @build="handleBuild"
        @delete="handleDelete"
        @toggle-visibility="handleToggleVisibility"
      />
    </div>

    <UploadDialog
      v-model="uploadDialogVisible"
      :algorithm-types="algorithmTypes"
      :uploading="uploading"
      @submit="handleUpload"
    />
  </div>
</template>
