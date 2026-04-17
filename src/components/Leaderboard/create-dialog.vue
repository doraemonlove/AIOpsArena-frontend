<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { QueryDatasetResItem } from '@/core/madison-addon-dataset'
import type {
  AlgorithmTypeOption,
  AvailableTrainRunItem,
  CreateLeaderboardPayload
} from '@/core/madison-addon-leaderboard'

const props = defineProps<{
  modelValue: boolean
  submitting?: boolean
  algorithmTypes: AlgorithmTypeOption[]
  datasets: QueryDatasetResItem[]
  availableTrainRuns: AvailableTrainRunItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: CreateLeaderboardPayload]
}>()

const { t } = useI18n()

const tableRef = ref<TableInstance>()
const name = ref('')
const algorithmTypeId = ref<number | null>(null)
const datasetId = ref<number | null>(null)
const visibility = ref(true)
const description = ref('')
const selectedRunIds = ref<number[]>([])
const sourceRunSearch = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const algorithmTypeNameMap = computed(() =>
  new Map(props.algorithmTypes.map((item) => [item.id, item.name]))
)

const filteredTrainRuns = computed(() => {
  let list = [...props.availableTrainRuns]
  if (algorithmTypeId.value !== null) {
    const selectedName = algorithmTypeNameMap.value.get(algorithmTypeId.value)
    list = list.filter((item) => {
      if (item.algorithm_type_id !== null && item.algorithm_type_id !== undefined) {
        return Number(item.algorithm_type_id) === algorithmTypeId.value
      }
      return [item.algorithm_type_name, item.algorithm_type].includes(selectedName)
    })
  }
  if (sourceRunSearch.value.trim()) {
    const keyword = sourceRunSearch.value.trim().toLowerCase()
    list = list.filter((item) =>
      [item.algorithm_name, item.dataset_name, String(item.id)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    )
  }
  return list.sort((a, b) => b.id - a.id)
})

const canSubmit = computed(() => {
  return (
    Boolean(name.value.trim()) &&
    algorithmTypeId.value !== null &&
    datasetId.value !== null &&
    selectedRunIds.value.length > 0
  )
})

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function resetForm() {
  name.value = ''
  algorithmTypeId.value = props.algorithmTypes[0]?.id ?? null
  datasetId.value = props.datasets[0]?.id ?? null
  visibility.value = true
  description.value = ''
  sourceRunSearch.value = ''
  selectedRunIds.value = []
  void nextTick(() => {
    clearSelectedRuns()
  })
}

function clearSelectedRuns() {
  selectedRunIds.value = []
  tableRef.value?.clearSelection()
}

function handleSelectionChange(rows: AvailableTrainRunItem[]) {
  selectedRunIds.value = rows.map((item) => item.id)
}

function submit() {
  if (!name.value.trim()) {
    ElMessage.warning(t('Leaderboard.Message.NameRequired'))
    return
  }
  if (!algorithmTypeId.value) {
    ElMessage.warning(t('Leaderboard.Message.AlgorithmTypeRequired'))
    return
  }
  if (!datasetId.value) {
    ElMessage.warning(t('Leaderboard.Message.DatasetRequired'))
    return
  }
  if (selectedRunIds.value.length === 0) {
    ElMessage.warning(t('Leaderboard.Message.SourceRunsRequired'))
    return
  }
  emit('submit', {
    name: name.value.trim(),
    algorithm_type_id: algorithmTypeId.value,
    dataset_id: datasetId.value,
    source_run_ids: selectedRunIds.value,
    description: description.value.trim(),
    visibility: visibility.value
  })
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) resetForm()
  }
)

watch(algorithmTypeId, () => {
  clearSelectedRuns()
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('Leaderboard.Create.Title')"
    width="1040px"
    top="6vh"
  >
    <div class="flex flex-col gap-5">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('Leaderboard.Create.Name') }}</span>
          <el-input
            v-model="name"
            :placeholder="t('Leaderboard.Create.NamePlaceholder')"
          />
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('Leaderboard.Create.AlgorithmType') }}</span>
          <el-select
            v-model="algorithmTypeId"
            :placeholder="t('Leaderboard.Create.AlgorithmTypePlaceholder')"
          >
            <el-option
              v-for="item in algorithmTypes"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-slate-600">{{ t('Leaderboard.Create.Dataset') }}</span>
          <el-select
            v-model="datasetId"
            :placeholder="t('Leaderboard.Create.DatasetPlaceholder')"
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
          <span class="text-sm text-slate-600">{{ t('Leaderboard.Create.Visibility') }}</span>
          <el-radio-group v-model="visibility">
            <el-radio :label="true">
              {{ t('Leaderboard.Visibility.Public') }}
            </el-radio>
            <el-radio :label="false">
              {{ t('Leaderboard.Visibility.Private') }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm text-slate-600">{{ t('Leaderboard.Create.Description') }}</span>
        <el-input
          v-model="description"
          type="textarea"
          :rows="4"
          :placeholder="t('Leaderboard.Create.DescriptionPlaceholder')"
        />
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div class="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="text-sm font-medium text-slate-900">
              {{ t('Leaderboard.Create.SourceRuns') }}
            </div>
            <div class="mt-1 text-xs text-slate-500">
              {{ t('Leaderboard.Create.SourceRunsHint') }}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <el-input
              v-model="sourceRunSearch"
              clearable
              :placeholder="t('Leaderboard.Create.SourceRunsSearch')"
            />
            <el-tag type="info" effect="plain">
              {{ t('Leaderboard.Create.SelectedRuns', { count: selectedRunIds.length }) }}
            </el-tag>
          </div>
        </div>

        <el-empty
          v-if="filteredTrainRuns.length === 0"
          :description="t('Leaderboard.Create.NoSourceRuns')"
        />

        <el-table
          v-else
          ref="tableRef"
          :data="filteredTrainRuns"
          max-height="360"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="52" />
          <el-table-column prop="id" :label="t('Leaderboard.Create.SourceRunTable.Id')" min-width="90" />
          <el-table-column
            prop="algorithm_name"
            :label="t('Leaderboard.Create.SourceRunTable.AlgorithmName')"
            min-width="220"
          />
          <el-table-column
            prop="dataset_name"
            :label="t('Leaderboard.Create.SourceRunTable.DatasetName')"
            min-width="180"
          />
          <el-table-column
            prop="status"
            :label="t('Leaderboard.Create.SourceRunTable.Status')"
            min-width="120"
          />
          <el-table-column :label="t('Leaderboard.Create.SourceRunTable.FinishedAt')" min-width="180">
            <template #default="{ row }">
              {{ formatTime(row.finished_at || row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="visible = false">
          {{ t('Leaderboard.Actions.Close') }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="submit"
        >
          {{ t('Leaderboard.Actions.Create') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
