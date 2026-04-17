<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RunDetail } from '@/core/madison-addon-algorithm-manager'
import RunStatusTag from './RunStatusTag.vue'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  detail: RunDetail | null
  logLoading?: boolean
  logContent: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function formatTime(value: any) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') return '--'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function labelFor(key: string) {
  const map: Record<string, string> = {
    id: 'ID',
    algorithm_name: t('TestRuns.Table.AlgorithmName'),
    algorithm_type: t('TestRuns.Table.AlgorithmType'),
    dataset_name: t('TestRuns.Table.DatasetName'),
    source_run_id: t('TestRuns.Table.SourceRunId'),
    mode: t('TestRuns.Create.Mode'),
    status: t('TestRuns.Table.Status'),
    evaluation_status: t('TestRuns.Table.EvaluationStatus'),
    exit_code: 'Exit Code',
    error_message: t('TestRuns.Table.ErrorMessage'),
    evaluation_error: 'Evaluation Error',
    created_at: t('TestRuns.Table.CreatedAt'),
    started_at: t('TestRuns.Table.StartedAt'),
    finished_at: t('TestRuns.Table.FinishedAt'),
    artifacts_path: 'Artifacts Path',
    log_path: 'Log Path',
    algorithm_deleted: t('TestRuns.Deleted'),
    algorithm_visibility: 'Visibility'
  }
  return map[key] || key
}

const basicEntries = computed(() => {
  if (!props.detail) return []
  const keys = [
    'id',
    'algorithm_name',
    'algorithm_type',
    'dataset_name',
    'source_run_id',
    'mode',
    'status',
    'evaluation_status',
    'exit_code',
    'error_message',
    'evaluation_error',
    'created_at',
    'started_at',
    'finished_at',
    'artifacts_path',
    'log_path',
    'algorithm_deleted',
    'algorithm_visibility'
  ]
  return keys
    .filter((key) => key in props.detail!)
    .map((key) => [key, props.detail?.[key]] as [string, any])
})
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="t('TestRuns.Detail.Title')"
    size="55%"
  >
    <div
      v-loading="loading"
      class="flex h-[calc(100dvh-120px)] min-h-0 flex-col gap-4"
    >
      <el-empty
        v-if="!detail && !loading"
        :description="t('TestRuns.Detail.Empty')"
      />
      <template v-else>
        <section class="flex basis-[45%] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div class="mb-4 text-sm font-medium text-slate-900">
            {{ t('TestRuns.Detail.BasicInfo') }}
          </div>
          <div class="min-h-0 flex-1 overflow-auto">
            <el-descriptions
              :column="2"
              border
            >
              <el-descriptions-item
                v-for="[key, value] in basicEntries"
                :key="key"
                :label="labelFor(key)"
                min-width="160"
              >
                <RunStatusTag
                  v-if="key === 'status'"
                  :status="value"
                />
                <RunStatusTag
                  v-else-if="key === 'evaluation_status'"
                  :status="value"
                  kind="evaluation"
                />
                <span
                  v-else-if="['created_at', 'started_at', 'finished_at'].includes(key)"
                  class="text-sm text-slate-700"
                >{{ formatTime(value) }}</span>
                <pre
                  v-else
                  class="whitespace-pre-wrap break-all text-sm text-slate-700"
                >{{ formatValue(value) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="detail && 'result_json' in detail"
                label="Result JSON"
                :span="2"
              >
                <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ formatValue(detail.result_json) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="detail && 'metrics_json' in detail"
                label="Metrics JSON"
                :span="2"
              >
                <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ formatValue(detail.metrics_json) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="detail && ('config_json' in detail || 'algorithm_config' in detail)"
                label="Algorithm Config"
                :span="2"
              >
                <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ formatValue(detail.algorithm_config ?? detail.config_json) }}</pre>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </section>

        <section class="flex basis-[55%] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div class="mb-4 text-sm font-medium text-slate-900">
            {{ t('TestRuns.Detail.Logs') }}
          </div>
          <div
            v-loading="logLoading"
            class="min-h-0 flex-1"
          >
            <el-empty
              v-if="!logLoading && !logContent"
              :description="t('TestRuns.Log.Empty')"
            />
            <pre
              v-else
              class="h-full overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-sm leading-6 text-slate-100"
            >{{ logContent }}</pre>
          </div>
        </section>
      </template>
    </div>
  </el-drawer>
</template>
