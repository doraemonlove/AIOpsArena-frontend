<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LeaderboardDetail, LeaderboardItem } from '@/core/madison-addon-leaderboard'
import ResultTable from './result-table.vue'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  detail: LeaderboardDetail | null
  isOwner?: boolean
  togglingVisibility?: boolean
  deletingItemIds?: number[]
  rerunningIds?: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  toggleVisibility: []
  rerun: [item: LeaderboardItem]
  delete: [item: LeaderboardItem]
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const basicEntries = computed(() => {
  if (!props.detail) return []
  return [
    ['id', props.detail.id],
    ['name', props.detail.name],
    ['algorithm_type_name', props.detail.algorithm_type_name],
    ['dataset_name', props.detail.dataset_name],
    ['run_count', props.detail.run_count],
    ['status', props.detail.status],
    ['visibility', props.detail.visibility ? t('Leaderboard.Visibility.Public') : t('Leaderboard.Visibility.Private')],
    ['owner_name', props.detail.owner_name],
    ['created_at', formatTime(props.detail.created_at)],
    ['updated_at', formatTime(props.detail.updated_at)],
    ['description', props.detail.description || '--']
  ]
})

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

</script>

<template>
  <el-drawer
    v-model="visible"
    :title="t('Leaderboard.Detail.Title')"
    size="72%"
  >
    <div
      v-loading="loading"
      class="flex h-[calc(100dvh-120px)] min-h-0 flex-col gap-4"
    >
      <el-empty
        v-if="!detail && !loading"
        :description="t('Leaderboard.Detail.Empty')"
      />

      <template v-else-if="detail">
        <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div class="text-sm font-medium text-slate-900">
              {{ t('Leaderboard.Detail.BasicInfo') }}
            </div>
            <el-button
              v-if="isOwner"
              size="small"
              plain
              :loading="togglingVisibility"
              @click="emit('toggleVisibility')"
            >
              {{ detail.visibility ? t('Leaderboard.Actions.SetPrivate') : t('Leaderboard.Actions.SetPublic') }}
            </el-button>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="[key, value] in basicEntries"
              :key="key"
              :label="key"
              min-width="180"
            >
              <pre class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ value }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-sm font-medium text-slate-900">
              {{ t('Leaderboard.Detail.ResultTitle') }}
            </div>
            <el-tag type="info" effect="plain">
              {{ t('Leaderboard.Detail.ItemsCount', { count: detail.items.length }) }}
            </el-tag>
          </div>

          <ResultTable
            :algorithm-type="detail.algorithm_type_name"
            :items="detail.items"
          />
        </section>

        <section class="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white/80 p-4">
          <div class="mb-4 text-sm font-medium text-slate-900">
            {{ t('Leaderboard.Detail.ItemsTitle') }}
          </div>

          <el-empty
            v-if="detail.items.length === 0"
            :description="t('Leaderboard.Detail.NoItems')"
          />

          <el-table
            v-else
            :data="detail.items"
            class="min-h-0 flex-1"
            max-height="100%"
          >
            <el-table-column prop="item_id" :label="t('Leaderboard.Detail.Table.ItemId')" min-width="90" />
            <el-table-column
              prop="algorithm_name"
              :label="t('Leaderboard.Detail.Table.AlgorithmName')"
              min-width="180"
            />
            <el-table-column
              prop="source_run_id"
              :label="t('Leaderboard.Detail.Table.SourceRunId')"
              min-width="120"
            />
            <el-table-column
              prop="test_run_id"
              :label="t('Leaderboard.Detail.Table.TestRunId')"
              min-width="120"
            />
            <el-table-column
              prop="item_status"
              :label="t('Leaderboard.Detail.Table.ItemStatus')"
              min-width="120"
            />
            <el-table-column
              prop="run_status"
              :label="t('Leaderboard.Detail.Table.RunStatus')"
              min-width="120"
            />
            <el-table-column
              prop="evaluation_status"
              :label="t('Leaderboard.Detail.Table.EvaluationStatus')"
              min-width="140"
            />
            <el-table-column
              prop="error_message"
              :label="t('Leaderboard.Detail.Table.ErrorMessage')"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column
              prop="evaluation_error"
              :label="t('Leaderboard.Detail.Table.EvaluationError')"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column :label="t('Leaderboard.Detail.Table.CreatedAt')" min-width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column
              v-if="isOwner"
              :label="t('Leaderboard.Table.Actions')"
              min-width="220"
              fixed="right"
            >
              <template #default="{ row }">
                <div class="flex flex-wrap items-center gap-3">
                  <el-button
                    v-if="['failed', 'canceled', 'finished'].includes(row.run_status || '')"
                    size="small"
                    type="primary"
                    plain
                    :loading="rerunningIds?.includes(row.item_id)"
                    @click="emit('rerun', row)"
                  >
                    {{ t('Leaderboard.Actions.Rerun') }}
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :loading="deletingItemIds?.includes(row.item_id)"
                    @click="emit('delete', row)"
                  >
                    {{ t('Leaderboard.Actions.DeleteItem') }}
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>
    </div>
  </el-drawer>
</template>
