<script setup lang="ts">
import item from './item.vue'
import tmr2t from '@/components/TimeRangePicker/tmr2t.vue'
import { Madison, MadisonDataQueryTaskStatus } from '@/core/madison'
import { formatDate } from '@/core/madison/utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const madison = Madison.getInstance()
const trace = madison.traces.data
const traces = madison.traces
const showTrace = computed(() => trace.value === null ? [] : trace.value.data === null ? [] : trace.value.data)

const searchValue = ref('')

const sortValue = ref('sort1')
const options = [
  {
    value: 'sort1',
    label: 'Data.Traces.MostRecent'
  },
  {
    value: 'sort2',
    label: 'Data.Traces.LongestFirst'
  },
  {
    value: 'sort3',
    label: 'Data.Traces.ShortestFirst'
  }
]

const searchedTracesList = computed(() => {
  if (searchValue.value !== '') {
    return showTrace.value.filter((t) => {
      return t.operationName.includes(searchValue.value) || t.traceId.includes(searchValue.value)
    })
  } else {
    return showTrace.value
  }
})

const sortedTracesList = computed(() => {
  if (sortValue.value === 'sort1') {
    return searchedTracesList.value
  } else if (sortValue.value === 'sort2') {
    return searchedTracesList.value.slice().sort((a, b) => b.duration - a.duration)
  } else if (sortValue.value === 'sort3') {
    return searchedTracesList.value.slice().sort((a, b) => a.duration - b.duration)
  } else {
    return searchedTracesList.value
  }
})

const useTracesList = sortedTracesList

const currentPage = ref(1)
const pageSize = ref(100)

const showTracesList = computed(() => {
  return useTracesList.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})
const date = computed(() => {
  if (traces.timestamp.value instanceof Date) return formatDate(traces.timestamp.value)
  return ''
})
</script>

<template>
  <div>
    <div class="flex gap-2 sticky top-0 p-4 platform-logs-list backdrop-blur z-10 justify-between max-w-[1200px] mx-auto items-center">
      <span>Timestamp: {{ date }}</span>
      <span>Range: {{ traces.rangeStr }}</span>
      <div>
        <el-input
          v-model="searchValue"
          style="width: 240px;"
          :placeholder="t('Data.Traces.SearchPrompt')"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-nowrap">{{ t('Data.Traces.Sort') }}</span>
        <el-select
          v-model="sortValue"
          placeholder="Select"
          style="width: 140px;"
        >
          <el-option
            v-for="op in options"
            :key="op.value"
            :label="t(op.label)"
            :value="op.value"
          />
        </el-select>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span>{{ useTracesList.length }}</span>
        <span>/</span>
        <span>{{ showTrace.length }}</span>
      </div>
      <div class="flex items-center">
        <el-button>
          <router-link :to="{ name: 'tracesearch'}">
            <span>{{ t('Data.Traces.GotoQueryTraceID') }}</span>
          </router-link>
        </el-button>
      </div>
    </div>
    <div class="flex flex-col gap-4 p-4">
      <div
        v-show="showTrace.length === 0"
        class="w-full flex justify-center items-center h-96"
      >
        <span
          v-show="trace?.status === MadisonDataQueryTaskStatus.LOADING || trace?.status === MadisonDataQueryTaskStatus.READY"
          class="text-moonlight-500 text-9xl"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
        </span>
        <span
          v-show="trace?.status === MadisonDataQueryTaskStatus.SUCCESS"
          class="text-moonlight-500 text-2xl"
        >No data</span>
        <span
          v-show="trace?.status === MadisonDataQueryTaskStatus.ERROR"
          class="text-red-500 text-2xl"
        >ERROR</span>
      </div>
      <item
        v-for="t in showTracesList"
        :key="t.traceId"
        v-model="searchValue"
        :trace="t"
      />
    </div>
    <div
      v-show="showTrace.length > 0"
      class="flex justify-end sticky bottom-0 p-4 platform-trace-list backdrop-blur z-10"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[100, 200, 300, 400]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="useTracesList.length"
      />
    </div>
  </div>
</template>

<style>
.platform-trace-list {
  background: linear-gradient(to left, var(--bg-bg) 0%, rgba(var(--bg-bg-rgb), 0.8) 50%, var(--bg-bg) 100%);
}
</style>
