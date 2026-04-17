<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AlgorithmDatasetType } from '@/core/madison-addon-algorithm-manager'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: boolean
  algorithmTypes: Array<{ id: string, name: string }>
  uploading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: {
    algorithm_name: string
    algorithm_type: string
    dataset_type: string
    visibility: boolean
    file: File
  }]
}>()

const datasetTypeOptions: AlgorithmDatasetType[] = ['log', 'metric', 'trace']
const { t } = useI18n()

const algorithmName = ref('')
const algorithmType = ref('')
const datasetTypes = ref<AlgorithmDatasetType[]>(['metric'])
const visibility = ref(false)
const file = ref<File | null>(null)
const fileList = ref<UploadFile[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function resetForm() {
  algorithmName.value = ''
  algorithmType.value = props.algorithmTypes[0]?.id || ''
  datasetTypes.value = ['metric']
  visibility.value = false
  file.value = null
  fileList.value = []
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) resetForm()
  }
)

watch(
  () => props.algorithmTypes,
  (types) => {
    if (!algorithmType.value && types.length > 0) {
      algorithmType.value = types[0].id
    }
  },
  { immediate: true }
)

function handleFileChange(uploadFile: UploadFile, uploadFiles: UploadFiles) {
  file.value = (uploadFile.raw as File) || null
  fileList.value = uploadFiles.slice(-1)
}

function handleFileRemove(_uploadFile: UploadFile, uploadFiles: UploadFiles) {
  file.value = uploadFiles[0]?.raw || null
  fileList.value = uploadFiles
}

function submit() {
  if (!algorithmName.value.trim()) {
    ElMessage.warning(t('Algorithm.Upload.Validation.NameRequired'))
    return
  }
  if (!algorithmType.value) {
    ElMessage.warning(t('Algorithm.Upload.Validation.TypeRequired'))
    return
  }
  if (datasetTypes.value.length === 0) {
    ElMessage.warning(t('Algorithm.Upload.Validation.DatasetTypeRequired'))
    return
  }
  if (!file.value) {
    ElMessage.warning(t('Algorithm.Upload.Validation.FileRequired'))
    return
  }
  emit('submit', {
    algorithm_name: algorithmName.value.trim(),
    algorithm_type: algorithmType.value,
    dataset_type: datasetTypes.value.join(','),
    visibility: visibility.value,
    file: file.value
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('Algorithm.Upload.Title')"
    width="560px"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('Algorithm.Upload.AlgorithmName') }}</span>
        <el-input
          v-model="algorithmName"
          :placeholder="t('Algorithm.Upload.AlgorithmNamePlaceholder')"
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('Algorithm.Upload.AlgorithmType') }}</span>
          <el-select
            v-model="algorithmType"
            :placeholder="t('Algorithm.Upload.AlgorithmTypePlaceholder')"
          >
            <el-option
              v-for="type in algorithmTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('Algorithm.Upload.DatasetType') }}</span>
          <el-checkbox-group
            v-model="datasetTypes"
            class="flex flex-wrap gap-x-4 gap-y-2 pt-2"
          >
            <el-checkbox
              v-for="type in datasetTypeOptions"
              :key="type"
              :label="type"
            >
              {{ type }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('Algorithm.Upload.Visibility') }}</span>
        <el-radio-group v-model="visibility">
          <el-radio :label="true">
            {{ t('Algorithm.Upload.Public') }}
          </el-radio>
          <el-radio :label="false">
            {{ t('Algorithm.Upload.Private') }}
          </el-radio>
        </el-radio-group>
      </div>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('Algorithm.Upload.File') }}</span>
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
        >
          <div class="flex flex-col items-center gap-2 text-slate-500">
            <el-icon size="28">
              <UploadFilled />
            </el-icon>
            <span>{{ t('Algorithm.Upload.FilePlaceholder') }}</span>
          </div>
        </el-upload>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="visible = false">
          {{ t('Algorithm.Actions.Cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="uploading"
          @click="submit"
        >
          {{ t('Algorithm.Upload.Submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
