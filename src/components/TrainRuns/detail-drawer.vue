<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrainRunDetail } from '@/core/madison-addon-algorithm-manager'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  detail: TrainRunDetail | null
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

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') return '--'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const basicEntries = computed(() => {
  if (!props.detail) return []
  const keys = [
    'id',
    'algorithm_name',
    'algorithm_type',
    'dataset_name',
    'mode',
    'status',
    'evaluation_status',
    'exit_code',
    'error_message',
    'artifacts_path',
    'log_path',
    'created_at',
    'started_at',
    'finished_at',
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
    :title="t('TrainRuns.Detail.Title')"
    size="50%"
  >
    <div
      v-loading="loading"
      class="flex h-[calc(100dvh-120px)] min-h-0 flex-col gap-4"
    >
      <el-empty
        v-if="!detail && !loading"
        :description="t('TrainRuns.Detail.Empty')"
      />
      <template v-else>
        <section class="flex basis-[45%] min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 overflow-hidden">
          <div class="mb-4 text-sm font-medium text-slate-900">
            {{ t('TrainRuns.Detail.BasicInfo') }}
          </div>
          <div class="min-h-0 flex-1 overflow-auto">
            <el-descriptions
              :column="2"
              border
            >
              <el-descriptions-item
                v-for="[key, value] in basicEntries"
                :key="key"
                :label="key"
                min-width="160"
              >
                <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ formatValue(value) }}</pre>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="detail && 'config_json' in detail"
                label="config_json"
                :span="2"
              >
                <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ formatValue(detail.config_json) }}</pre>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </section>

        <section class="flex basis-[55%] min-h-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 overflow-hidden">
          <div class="mb-4 text-sm font-medium text-slate-900">
            {{ t('TrainRuns.Detail.Logs') }}
          </div>
          <div
            v-loading="logLoading"
            class="min-h-0 flex-1"
          >
            <el-empty
              v-if="!logLoading && !logContent"
              :description="t('TrainRuns.Log.Empty')"
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
