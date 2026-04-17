<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { TrainRunItem as TestRunItem } from '@/core/madison-addon-algorithm-manager'
import { localGet } from '@/core/madison/utils'
import { Login } from '@/core/madison-addon-login'
import RunStatusTag from './RunStatusTag.vue'

const props = defineProps<{
  items: TestRunItem[]
  loading?: boolean
  deletingIds: number[]
  cancelingIds: number[]
  rerunningIds: number[]
  algorithmTypes: string[]
}>()

const emit = defineEmits<{
  detail: [item: TestRunItem]
  rerun: [item: TestRunItem]
  cancel: [item: TestRunItem]
  delete: [item: TestRunItem]
}>()

const { t } = useI18n()
const currentLoginKey = localGet(Login.LOGIN_KEY, '') || ''
const typeFilter = ref('__all__')
const statusFilter = ref('__all__')
const search = ref('')
const page = ref(1)
const pageSize = ref(10)
const statusOptions = ['waiting', 'starting', 'running', 'finished', 'failed', 'canceled']

const filteredItems = computed(() => {
  let list = [...props.items]
  if (typeFilter.value !== '__all__') {
    list = list.filter((item) => item.algorithm_type === typeFilter.value)
  }
  if (statusFilter.value !== '__all__') {
    list = list.filter((item) => item.status === statusFilter.value)
  }
  if (search.value.trim()) {
    const keyword = search.value.trim().toLowerCase()
    list = list.filter((item) =>
      item.algorithm_name.toLowerCase().includes(keyword) ||
      (item.dataset_name || '').toLowerCase().includes(keyword)
    )
  }
  return list.sort((a, b) => b.id - a.id)
})

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

watch([typeFilter, statusFilter, search], () => {
  page.value = 1
})

watch([filteredItems, pageSize], () => {
  const maxPage = Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

function formatTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function isOwner(item: TestRunItem) {
  return Boolean(item.owner_name) && item.owner_name === currentLoginKey
}

function canCancel(item: TestRunItem) {
  return ['waiting', 'starting', 'running'].includes(item.status) && isOwner(item)
}

function canDelete(item: TestRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && isOwner(item)
}

function canRerun(item: TestRunItem) {
  return ['finished', 'failed', 'canceled'].includes(item.status) && isOwner(item)
}

function shortErrorMessage(value?: string | null) {
  if (!value) return '--'
  return value.length > 40 ? `${value.slice(0, 40)}...` : value
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-slate-500">{{ t('TestRuns.Filter.Type') }}</span>
        <el-tag
          :type="typeFilter === '__all__' ? 'primary' : 'info'"
          class="cursor-pointer"
          effect="plain"
          @click="typeFilter = '__all__'"
        >
          {{ t('TestRuns.Filter.All') }}
        </el-tag>
        <el-tag
          v-for="type in algorithmTypes"
          :key="type"
          :type="typeFilter === type ? 'primary' : 'info'"
          class="cursor-pointer"
          effect="plain"
          @click="typeFilter = type"
        >
          {{ type }}
        </el-tag>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <el-select v-model="statusFilter">
          <el-option :label="t('TestRuns.Filter.All')" value="__all__" />
          <el-option
            v-for="status in statusOptions"
            :key="status"
            :label="t(`TestRuns.StatusText.${status}`)"
            :value="status"
          />
        </el-select>
        <el-input
          v-model="search"
          :placeholder="t('TestRuns.Filter.Search')"
          clearable
        />
      </div>
    </div>

    <el-empty
      v-if="!loading && filteredItems.length === 0"
      :description="t('TestRuns.Empty')"
    />

    <el-table
      v-else
      v-loading="loading"
      :data="pagedItems"
      style="width: 100%"
    >
      <el-table-column prop="id" :label="t('TestRuns.Table.Id')" min-width="80" />
      <el-table-column prop="algorithm_name" :label="t('TestRuns.Table.AlgorithmName')" min-width="220">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <span>{{ row.algorithm_name }}</span>
            <el-tag
              v-if="row.algorithm_deleted"
              type="danger"
            >
              {{ t('TestRuns.Deleted') }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="algorithm_type" :label="t('TestRuns.Table.AlgorithmType')" min-width="160" />
      <el-table-column prop="source_run_id" :label="t('TestRuns.Table.SourceRunId')" min-width="130" />
      <el-table-column prop="dataset_name" :label="t('TestRuns.Table.DatasetName')" min-width="160" />
      <el-table-column prop="owner_name" :label="t('TestRuns.Table.OwnerName')" min-width="140" />
      <el-table-column :label="t('TestRuns.Table.Status')" min-width="140">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <RunStatusTag :status="row.status" />
            <el-icon
              v-if="canCancel(row)"
              class="is-loading text-amber-500"
            >
              <Loading />
            </el-icon>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.EvaluationStatus')" min-width="140">
        <template #default="{ row }">
          <RunStatusTag
            :status="row.evaluation_status"
            kind="evaluation"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.ErrorMessage')" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span :class="{ 'text-rose-500': row.status === 'failed' }">
            {{ shortErrorMessage(row.error_message || row.evaluation_error) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.CreatedAt')" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.StartedAt')" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.started_at) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.FinishedAt')" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.finished_at) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('TestRuns.Table.Actions')" min-width="320" fixed="right">
        <template #default="{ row }">
          <div class="flex flex-wrap items-center gap-3">
            <el-button size="small" plain @click="emit('detail', row)">
              {{ t('TestRuns.Actions.Detail') }}
            </el-button>
            <el-button
              v-if="canRerun(row)"
              size="small"
              type="primary"
              plain
              :loading="rerunningIds.includes(row.id)"
              @click="emit('rerun', row)"
            >
              {{ t('TestRuns.Actions.Rerun') }}
            </el-button>
            <el-button
              v-if="canCancel(row)"
              size="small"
              type="warning"
              plain
              :loading="cancelingIds.includes(row.id)"
              @click="emit('cancel', row)"
            >
              {{ t('TestRuns.Actions.CancelTask') }}
            </el-button>
            <el-button
              v-if="canDelete(row)"
              size="small"
              type="danger"
              plain
              :loading="deletingIds.includes(row.id)"
              @click="emit('delete', row)"
            >
              {{ t('TestRuns.Actions.Delete') }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        background
        layout="total, sizes, prev, pager, next"
        :total="filteredItems.length"
        :page-sizes="[10, 20, 50]"
      />
    </div>
  </section>
</template>
