<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { AlgorithmItem } from '@/core/madison-addon-algorithm-manager'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'

const props = defineProps<{
  modelValue: boolean
  submitting?: boolean
  algorithms: AlgorithmItem[]
  algorithmTypes: string[]
  datasets: QueryDatasetResItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: {
    template_id: number
    mode: 'train'
    dataset_id: number
    algorithm_config: Record<string, any>
  }]
}>()

const { t } = useI18n()
const selectedType = ref('__all__')
const templateId = ref<number | null>(null)
const datasetId = ref<number | null>(null)
const defaultConfigText = '{\n  "lr": 0.01,\n  "epochs": 10\n}'
const configText = ref(defaultConfigText)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const visibleAlgorithms = computed(() => {
  const list = props.algorithms.filter((item) => item.status === 'ready')
  if (selectedType.value === '__all__') return list
  return list.filter((item) => item.algorithm_type === selectedType.value)
})

function resetForm() {
  selectedType.value = '__all__'
  templateId.value = visibleAlgorithms.value[0]?.template_id || null
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
  templateId.value = visibleAlgorithms.value[0]?.template_id || null
})

function submit() {
  if (!templateId.value) {
    ElMessage.warning(t('TrainRuns.Message.AlgorithmRequired'))
    return
  }
  if (!datasetId.value) {
    ElMessage.warning(t('TrainRuns.Message.DatasetRequired'))
    return
  }
  let algorithmConfig: Record<string, any> = {}
  try {
    algorithmConfig = configText.value.trim() ? JSON.parse(configText.value) : {}
  } catch (_) {
    ElMessage.warning(t('TrainRuns.Message.ConfigInvalid'))
    return
  }
  emit('submit', {
    template_id: templateId.value,
    mode: 'train',
    dataset_id: datasetId.value,
    algorithm_config: algorithmConfig
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('TrainRuns.Create.Title')"
    width="680px"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('TrainRuns.Create.AlgorithmType') }}</span>
          <el-select
            v-model="selectedType"
            :placeholder="t('TrainRuns.Create.AlgorithmTypePlaceholder')"
          >
            <el-option
              :label="t('TrainRuns.Filter.All')"
              value="__all__"
            />
            <el-option
              v-for="type in algorithmTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('TrainRuns.Create.Mode') }}</span>
          <el-input :model-value="t('TrainRuns.Create.Train')" disabled />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('TrainRuns.Create.AlgorithmTemplate') }}</span>
        <el-select
          v-model="templateId"
          :placeholder="t('TrainRuns.Create.AlgorithmTemplatePlaceholder')"
          filterable
        >
          <el-option
            v-for="item in visibleAlgorithms"
            :key="item.template_id"
            :label="`${item.algorithm_name} (${item.algorithm_type})`"
            :value="item.template_id"
          />
        </el-select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('TrainRuns.Create.Dataset') }}</span>
        <el-select
          v-model="datasetId"
          :placeholder="t('TrainRuns.Create.DatasetPlaceholder')"
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
        <span class="text-sm text-slate-600">{{ t('TrainRuns.Create.Config') }}</span>
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
          {{ t('TrainRuns.Actions.Close') }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          {{ t('TrainRuns.CreateTrain') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
