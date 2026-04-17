<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { AvailableTrainRunItem } from '@/core/madison-addon-algorithm-manager'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'

const props = defineProps<{
  modelValue: boolean
  submitting?: boolean
  availableTrainRuns: AvailableTrainRunItem[]
  datasets: QueryDatasetResItem[]
  algorithmTypes: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: {
    template_id: number
    mode: 'test'
    dataset_id: number
    source_run_id: number
    algorithm_config: Record<string, any>
  }]
}>()

const { t } = useI18n()
const selectedType = ref('__all__')
const sourceRunId = ref<number | null>(null)
const datasetId = ref<number | null>(null)
const defaultConfigText = '{\n  "threshold": 0.5\n}'
const configText = ref(defaultConfigText)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const filteredTrainRuns = computed(() => {
  if (selectedType.value === '__all__') return props.availableTrainRuns
  return props.availableTrainRuns.filter((item) => item.algorithm_type === selectedType.value)
})

const canSubmit = computed(() => Boolean(sourceRunId.value && datasetId.value && filteredTrainRuns.value.length > 0))

function resetForm() {
  selectedType.value = '__all__'
  sourceRunId.value = filteredTrainRuns.value[0]?.id || null
  datasetId.value = props.datasets[0]?.id || null
  configText.value = defaultConfigText
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) resetForm()
  }
)

watch(selectedType, () => {
  sourceRunId.value = filteredTrainRuns.value[0]?.id || null
})

function submit() {
  if (!sourceRunId.value) {
    ElMessage.warning(t('TestRuns.Message.SourceRunRequired'))
    return
  }
  if (!datasetId.value) {
    ElMessage.warning(t('TestRuns.Message.DatasetRequired'))
    return
  }

  let algorithmConfig: Record<string, any> = {}
  try {
    algorithmConfig = configText.value.trim() ? JSON.parse(configText.value) : {}
  } catch (_) {
    ElMessage.warning(t('TestRuns.Message.ConfigInvalid'))
    return
  }

  const selectedRun = props.availableTrainRuns.find((item) => item.id === sourceRunId.value)
  if (!selectedRun) {
    ElMessage.warning(t('TestRuns.Message.SourceRunRequired'))
    return
  }

  emit('submit', {
    template_id: selectedRun.template_id,
    mode: 'test',
    dataset_id: datasetId.value,
    source_run_id: sourceRunId.value,
    algorithm_config: algorithmConfig
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('TestRuns.Create.Title')"
    width="720px"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('TestRuns.Create.AlgorithmType') }}</span>
          <el-select
            v-model="selectedType"
            :placeholder="t('TestRuns.Create.AlgorithmTypePlaceholder')"
          >
            <el-option :label="t('TestRuns.Filter.All')" value="__all__" />
            <el-option
              v-for="type in algorithmTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('TestRuns.Create.Mode') }}</span>
          <el-input :model-value="t('TestRuns.Create.Test')" disabled />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('TestRuns.Create.SourceRun') }}</span>
        <el-select
          v-model="sourceRunId"
          :placeholder="t('TestRuns.Create.SourceRunPlaceholder')"
          filterable
        >
          <el-option
            v-for="item in filteredTrainRuns"
            :key="item.id"
            :label="`#${item.id} ${item.algorithm_name} (${item.algorithm_type})`"
            :value="item.id"
          />
        </el-select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('TestRuns.Create.Dataset') }}</span>
        <el-select
          v-model="datasetId"
          :placeholder="t('TestRuns.Create.DatasetPlaceholder')"
          filterable
        >
          <el-option
            v-for="item in datasets"
            :key="item.id"
            :label="item.dataset_name"
            :value="item.id"
          />
        </el-select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('TestRuns.Create.Config') }}</span>
        <el-input
          v-model="configText"
          type="textarea"
          :rows="10"
          :placeholder="defaultConfigText"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="visible = false">
          {{ t('TestRuns.Actions.Close') }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="submit"
        >
          {{ t('TestRuns.CreateTest') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
