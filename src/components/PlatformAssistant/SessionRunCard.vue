<script setup lang="ts">
import { computed } from 'vue'
import { CloseBold, Delete, VideoPlay } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import RunStatusTag from '@/views/Algorithm/components/RunStatusTag.vue'
import type { SessionRun } from '@/core/madison-addon-platform-assistant'

const props = defineProps<{
  run: SessionRun
  canceling?: boolean
  deleting?: boolean
}>()

const emit = defineEmits<{
  cancel: [run: SessionRun]
  delete: [run: SessionRun]
  analyze: [run: SessionRun]
}>()

const { t, locale } = useI18n()

const displayTitle = computed(
  () => props.run.title?.trim() || props.run.algorithm_name?.trim() || `run_id=${props.run.run_id}`
)

const canCancel = computed(() => ['waiting', 'starting', 'running'].includes(props.run.status))
const canAnalyze = computed(() => props.run.status === 'finished' || props.run.status === 'failed')

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getEvaluationStatusText(status?: string) {
  if (!status) return '--'
  const key = `TestRuns.EvaluationStatus.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}
</script>

<template>
  <article class="session-run-card">
    <div class="session-run-card__top">
      <div class="session-run-card__title">{{ displayTitle }}</div>
      <RunStatusTag :status="run.status" />
    </div>

    <div class="session-run-card__meta">run_id={{ run.run_id }}</div>

    <div class="session-run-card__grid">
      <div class="session-run-card__field">
        <span>{{ t('PlatformAssistant.RunPanel.Mode') }}</span>
        <strong>{{ run.mode || '--' }}</strong>
      </div>
      <div class="session-run-card__field">
        <span>{{ t('PlatformAssistant.RunPanel.Dataset') }}</span>
        <strong>{{ run.dataset_name || '--' }}</strong>
      </div>
      <div class="session-run-card__field">
        <span>{{ t('PlatformAssistant.RunPanel.EvaluationStatus') }}</span>
        <strong>
          <RunStatusTag
            v-if="run.evaluation_status"
            :status="run.evaluation_status"
            kind="evaluation"
          />
          <template v-else>{{ getEvaluationStatusText(run.evaluation_status) }}</template>
        </strong>
      </div>
      <div class="session-run-card__field">
        <span>{{ t('PlatformAssistant.RunPanel.CreatedAt') }}</span>
        <strong>{{ formatTime(run.created_at) }}</strong>
      </div>
      <div
        v-if="run.finished_at"
        class="session-run-card__field"
      >
        <span>{{ t('PlatformAssistant.RunPanel.FinishedAt') }}</span>
        <strong>{{ formatTime(run.finished_at) }}</strong>
      </div>
    </div>

    <div class="session-run-card__actions">
      <el-button
        v-if="canAnalyze"
        size="small"
        text
        :icon="VideoPlay"
        @click="emit('analyze', run)"
      >
        {{ run.status === 'failed' ? t('PlatformAssistant.Actions.AnalyzeFailure') : t('PlatformAssistant.Actions.AnalyzeResult') }}
      </el-button>
      <el-button
        v-if="canCancel"
        size="small"
        text
        type="warning"
        :icon="CloseBold"
        :loading="canceling"
        @click="emit('cancel', run)"
      >
        {{ t('PlatformAssistant.Actions.CancelRun') }}
      </el-button>
      <el-button
        size="small"
        text
        type="danger"
        :icon="Delete"
        :loading="deleting"
        @click="emit('delete', run)"
      >
        {{ t('PlatformAssistant.Actions.DeleteRun') }}
      </el-button>
    </div>
  </article>
</template>

<style scoped>
.session-run-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  padding: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.dark .session-run-card {
  border-color: rgba(148, 163, 184, 0.16);
  background: rgba(30, 41, 59, 0.72);
  box-shadow: none;
}

.session-run-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.session-run-card__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #0f172a;
  word-break: break-word;
}

.dark .session-run-card__title {
  color: #e2e8f0;
}

.session-run-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.dark .session-run-card__meta {
  color: #94a3b8;
}

.session-run-card__grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.session-run-card__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.session-run-card__field span {
  color: #64748b;
}

.session-run-card__field strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #1e293b;
  font-weight: 600;
  text-align: right;
}

.dark .session-run-card__field span {
  color: #94a3b8;
}

.dark .session-run-card__field strong {
  color: #e2e8f0;
}

.session-run-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
</style>
