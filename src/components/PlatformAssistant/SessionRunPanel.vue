<script setup lang="ts">
import { RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { SessionRun } from '@/core/madison-addon-platform-assistant'
import SessionRunCard from './SessionRunCard.vue'

defineProps<{
  sessionId?: string
  runs: SessionRun[]
  loading?: boolean
  error?: string
  cancelingRunIds: number[]
  deletingRunIds: number[]
}>()

const emit = defineEmits<{
  refresh: []
  cancel: [run: SessionRun]
  delete: [run: SessionRun]
  analyze: [run: SessionRun]
}>()

const { t } = useI18n()
</script>

<template>
  <aside class="assistant-runs">
    <div class="assistant-runs__header">
      <div>
        <div class="assistant-runs__title">{{ t('PlatformAssistant.RunPanel.Title') }}</div>
        <div class="assistant-runs__subtitle">
          {{ sessionId ? t('PlatformAssistant.RunPanel.Subtitle') : t('PlatformAssistant.RunPanel.NoSession') }}
        </div>
      </div>
      <el-button
        circle
        text
        :icon="RefreshRight"
        :disabled="!sessionId"
        :loading="loading"
        @click="emit('refresh')"
      />
    </div>

    <div
      v-if="error"
      class="assistant-runs__error"
    >
      {{ error }}
    </div>

    <el-scrollbar class="assistant-runs__body">
      <div
        v-if="!sessionId"
        class="assistant-runs__placeholder"
      >
        {{ t('PlatformAssistant.RunPanel.NoSession') }}
      </div>
      <div
        v-else-if="loading && !runs.length"
        class="assistant-runs__placeholder"
      >
        {{ t('PlatformAssistant.RunPanel.Loading') }}
      </div>
      <div
        v-else-if="!runs.length"
        class="assistant-runs__placeholder"
      >
        {{ t('PlatformAssistant.RunPanel.Empty') }}
      </div>
      <div
        v-else
        class="assistant-runs__list"
      >
        <SessionRunCard
          v-for="run in runs"
          :key="run.run_id"
          :run="run"
          :canceling="cancelingRunIds.includes(run.run_id)"
          :deleting="deletingRunIds.includes(run.run_id)"
          @cancel="emit('cancel', run)"
          @delete="emit('delete', run)"
          @analyze="emit('analyze', run)"
        />
      </div>
    </el-scrollbar>
  </aside>
</template>

<style scoped>
.assistant-runs {
  display: flex;
  width: 320px;
  flex-shrink: 0;
  flex-direction: column;
  border-left: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(248, 250, 252, 0.82);
}

.dark .assistant-runs {
  background: rgba(15, 23, 42, 0.62);
}

.assistant-runs__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 52px 14px 20px;
}

.assistant-runs__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.assistant-runs__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.dark .assistant-runs__title {
  color: #e2e8f0;
}

.dark .assistant-runs__subtitle {
  color: #94a3b8;
}

.assistant-runs__error {
  margin: 0 20px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  padding: 10px 12px;
  font-size: 12px;
  color: #b91c1c;
}

.dark .assistant-runs__error {
  color: #fca5a5;
}

.assistant-runs__body {
  flex: 1;
  padding: 0 16px 16px;
}

.assistant-runs__placeholder {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
}

.dark .assistant-runs__placeholder {
  color: #94a3b8;
}

.assistant-runs__list {
  display: grid;
  gap: 12px;
}

@media (max-width: 1200px) {
  .assistant-runs {
    width: 100%;
    max-height: 280px;
    border-top: 1px solid rgba(148, 163, 184, 0.18);
    border-left: 0;
  }
}
</style>
