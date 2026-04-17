<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RunStatusTag from '@/views/Algorithm/components/RunStatusTag.vue'
import type {
  LeaderboardItem,
  LeaderboardMetricGroup,
  LeaderboardMetricLeaf
} from '@/core/madison-addon-leaderboard'

const props = defineProps<{
  algorithmType: string
  items: LeaderboardItem[]
}>()

defineEmits<{
  rerun: [item: LeaderboardItem]
}>()

const { t } = useI18n()

const predefinedMetricGroups: Record<string, LeaderboardMetricGroup[]> = {
  anomaly_detection: [
    {
      key: 'point_based_f1',
      label: 'point_based_f1',
      children: [
        { key: 'precision', label: 'precision', path: ['point_based_f1', 'precision'] },
        { key: 'recall', label: 'recall', path: ['point_based_f1', 'recall'] },
        { key: 'f1_score', label: 'f1_score', path: ['point_based_f1', 'f1_score'] }
      ]
    },
    {
      key: 'range_based_f1',
      label: 'range_based_f1',
      children: [
        { key: 'precision', label: 'precision', path: ['range_based_f1', 'precision'] },
        { key: 'recall', label: 'recall', path: ['range_based_f1', 'recall'] },
        { key: 'f1_score', label: 'f1_score', path: ['range_based_f1', 'f1_score'] }
      ]
    },
    {
      key: 'event_based_f1',
      label: 'event_based_f1',
      children: [
        { key: 'precision', label: 'precision', path: ['event_based_f1', 'precision'] },
        { key: 'recall', label: 'recall', path: ['event_based_f1', 'recall'] },
        { key: 'f1_score', label: 'f1_score', path: ['event_based_f1', 'f1_score'] }
      ]
    }
  ],
  fault_classification: [
    {
      key: 'classification_metrics',
      label: 'classification_metrics',
      children: [
        { key: 'accuracy', label: 'accuracy', path: ['classification_metrics', 'accuracy'] },
        { key: 'macro_precision', label: 'macro_precision', path: ['classification_metrics', 'macro_precision'] },
        { key: 'macro_recall', label: 'macro_recall', path: ['classification_metrics', 'macro_recall'] },
        { key: 'macro_f1', label: 'macro_f1', path: ['classification_metrics', 'macro_f1'] }
      ]
    }
  ],
  root_cause_analysis: [
    {
      key: 'ranking_metrics',
      label: 'ranking_metrics',
      children: [
        { key: 'acc_at_1', label: 'acc_at_1', path: ['ranking_metrics', 'acc_at_1'] },
        { key: 'acc_at_3', label: 'acc_at_3', path: ['ranking_metrics', 'acc_at_3'] },
        { key: 'acc_at_5', label: 'acc_at_5', path: ['ranking_metrics', 'acc_at_5'] },
        { key: 'avg_at_3', label: 'avg_at_3', path: ['ranking_metrics', 'avg_at_3'] },
        { key: 'avg_at_5', label: 'avg_at_5', path: ['ranking_metrics', 'avg_at_5'] },
        { key: 'mar', label: 'mar', path: ['ranking_metrics', 'mar'] }
      ]
    }
  ],
  rca: [
    {
      key: 'ranking_metrics',
      label: 'ranking_metrics',
      children: [
        { key: 'acc_at_1', label: 'acc_at_1', path: ['ranking_metrics', 'acc_at_1'] },
        { key: 'acc_at_3', label: 'acc_at_3', path: ['ranking_metrics', 'acc_at_3'] },
        { key: 'acc_at_5', label: 'acc_at_5', path: ['ranking_metrics', 'acc_at_5'] },
        { key: 'avg_at_3', label: 'avg_at_3', path: ['ranking_metrics', 'avg_at_3'] },
        { key: 'avg_at_5', label: 'avg_at_5', path: ['ranking_metrics', 'avg_at_5'] },
        { key: 'mar', label: 'mar', path: ['ranking_metrics', 'mar'] }
      ]
    }
  ]
}

function normalizeAlgorithmType(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
}

function inferMetricGroups(items: LeaderboardItem[]): LeaderboardMetricGroup[] {
  const sample = items.find((item) => item.metrics_json && typeof item.metrics_json === 'object')?.metrics_json
  if (!sample || typeof sample !== 'object') return []

  return Object.entries(sample as Record<string, any>).map(([groupKey, groupValue]) => {
    const groupRecord = groupValue && typeof groupValue === 'object' ? groupValue : {}
    const children = Object.keys(groupRecord).map((metricKey) => ({
      key: metricKey,
      label: metricKey,
      path: [groupKey, metricKey]
    }))
    return {
      key: groupKey,
      label: groupKey,
      children
    }
  })
}

const metricGroups = computed(() => {
  const normalizedType = normalizeAlgorithmType(props.algorithmType)
  return predefinedMetricGroups[normalizedType] || inferMetricGroups(props.items)
})

function isRowReady(item: LeaderboardItem) {
  return item.run_status === 'finished' && ['success', 'skipped'].includes(item.evaluation_status || '')
}

function getMetricValue(item: LeaderboardItem, column: LeaderboardMetricLeaf) {
  if (!isRowReady(item)) return '--'
  let current: any = item.metrics_json
  for (const key of column.path) {
    if (!current || typeof current !== 'object' || !(key in current)) return '--'
    current = current[key]
  }
  if (current === null || current === undefined || current === '') return '--'
  const numericValue = Number(current)
  if (Number.isFinite(numericValue)) return numericValue.toFixed(2)
  return String(current)
}

function itemStatusTagType(status?: string | null) {
  if (status === 'finished' || status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'skipped' || status === 'canceled') return 'info'
  return 'warning'
}

function formatItemStatus(status?: string | null) {
  if (!status) return '--'
  return status
}
</script>

<template>
  <div class="leaderboard-result-table">
    <el-empty
      v-if="items.length === 0"
      :description="t('Leaderboard.Detail.NoItems')"
    />

    <el-table
      v-else
      :data="items"
      style="width: 100%"
    >
      <el-table-column
        prop="algorithm_name"
        :label="t('Leaderboard.Detail.ResultTable.AlgorithmName')"
        min-width="240"
        fixed="left"
      >
        <template #default="{ row }">
          <div class="flex flex-col gap-2 py-1">
            <div class="font-medium text-slate-900">
              {{ row.algorithm_name || '--' }}
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <el-tag
                size="small"
                :type="itemStatusTagType(row.item_status)"
                effect="plain"
              >
                {{ `item: ${formatItemStatus(row.item_status)}` }}
              </el-tag>
              <RunStatusTag
                v-if="row.run_status"
                :status="row.run_status"
              />
              <RunStatusTag
                v-if="row.evaluation_status"
                :status="row.evaluation_status"
                kind="evaluation"
              />
            </div>
            <div
              v-if="row.error_message || row.evaluation_error"
              class="text-xs leading-5 text-rose-500"
            >
              {{ row.error_message || row.evaluation_error }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="t('Leaderboard.Detail.ResultTable.EvaluationResult')">
        <template v-if="metricGroups.length > 0">
          <template
            v-for="group in metricGroups"
            :key="group.key"
          >
            <el-table-column
              :label="group.label"
              min-width="150"
            >
              <template
                v-for="column in group.children"
                :key="`${group.key}-${column.key}`"
              >
                <el-table-column
                  :label="column.label"
                  min-width="120"
                  align="center"
                  header-align="center"
                >
                  <template #default="{ row }">
                    <span class="font-medium text-slate-700">{{ getMetricValue(row, column) }}</span>
                  </template>
                </el-table-column>
              </template>
            </el-table-column>
          </template>
        </template>

        <el-table-column
          v-else
          :label="t('Leaderboard.Detail.ResultTable.NoMetrics')"
          min-width="180"
          align="center"
        >
          <template #default>
            --
          </template>
        </el-table-column>
      </el-table-column>

    </el-table>
  </div>
</template>

<style scoped>
:deep(.leaderboard-result-table .el-table th.el-table__cell) {
  background: #dbeafe;
  color: #2563eb;
}

:deep(.leaderboard-result-table .el-table .cell) {
  word-break: break-word;
}
</style>
