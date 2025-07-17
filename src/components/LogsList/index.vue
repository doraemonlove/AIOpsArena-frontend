<script setup lang="ts">
import item from './item.vue'
import tmr2t from '@/components/TimeRangePicker/tmr2t.vue'
import { Madison, MadisonDataQueryTaskStatus } from '@/core/madison'
import type { FullLogs } from '@/core/madison-addon-logs/core/logs'
import { formatDate } from '@/core/madison/utils'
import { computed, reactive, ref } from 'vue'
import { JsonViewer } from 'vue3-json-viewer'

const madison = Madison.getInstance()
const logs = madison.logs
const log = logs.data
const showLog = computed(() => log.value === null ? [] : log.value.data === null ? [] : log.value.data)
const searchValue = ref('')
const selectValue = ref('all')
const options = computed<{value: string, label: string}[]>(() => {
  const set = new Set<string>()
  showLog.value.forEach((t) => {
    set.add(t.podName)
  })
  const list = []
  list.push(...Array.from(set).map((t) => {
    return {
      value: t,
      label: t
    }
  }))
  list.sort((a, b) => {
    return a.label.localeCompare(b.label)
  })
  list.unshift({
    value: 'all',
    label: 'All'
  })
  return list
})
const searchedLogsList = computed(() => {
  if (searchValue.value !== '') {
    return showLog.value.filter((t) => {
      return t.message.includes(searchValue.value) || t.logId.includes(searchValue.value) || t.podName.includes(searchValue.value)
    })
  } else {
    return showLog.value
  }
})

const selectedLogsList = computed(() => {
  if (selectValue.value === 'all') {
    return searchedLogsList.value
  } else {
    return searchedLogsList.value.filter((t) => {
      return t.podName === selectValue.value
    })
  }
})

const currentPage = ref(1)
const pageSize = ref(100)

const useLogsList = selectedLogsList

const showLogsList = computed(() => {
  return useLogsList.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

const theme = madison.theme.theme
const drawer = ref(false)
let jsonData = {}
function showDetail(data: FullLogs) {
  drawer.value = true
  jsonData = reactive(data.data)
}

const date = computed(() => {
  if (logs.timestamp.value instanceof Date) return formatDate(logs.timestamp.value)
  return ''
})
</script>

<template>
  <div>
    <div class="flex gap-2 sticky top-0 p-4 platform-logs-list backdrop-blur z-10 justify-between max-w-[1200px] mx-auto items-center">
      <span>Timestamp: {{ date }}</span>
      <span>Range: {{ logs.rangeStr }}</span>
      <div>
        <el-input
          v-model="searchValue"
          style="width: 240px;"
          placeholder="Search msg, log ID, pod name"
        />
      </div>
      <div class="flex items-center gap-2">
        <span>Filter:</span>
        <el-select
          v-model="selectValue"
          placeholder="Select"
          style="width: 140px;"
        >
          <el-option
            v-for="op in options"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          />
        </el-select>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span>{{ useLogsList.length }}</span>
        <span>/</span>
        <span>{{ showLog.length }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-4 p-4">
      <div
        v-show="showLog.length === 0"
        class="w-full flex justify-center items-center h-96"
      >
        <span
          v-show="log?.status === MadisonDataQueryTaskStatus.LOADING || log?.status === MadisonDataQueryTaskStatus.READY"
          class="text-moonlight-500 text-9xl"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
        </span>
        <span
          v-show="log?.status === MadisonDataQueryTaskStatus.SUCCESS"
          class="text-moonlight-500 text-2xl"
        >No data</span>
        <span
          v-show="log?.status === MadisonDataQueryTaskStatus.ERROR"
          class="text-red-500 text-2xl"
        >ERROR</span>
      </div>
      <item
        v-for="l in showLogsList"
        :key="l.logId"
        v-model="searchValue"
        :log="l"
        @show-detail="showDetail"
      />
    </div>
    <div
      v-show="showLog.length > 0"
      class="flex justify-end sticky bottom-0 p-4 platform-logs-list backdrop-blur z-10"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[100, 200, 300, 400]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="useLogsList.length"
      />
    </div>
    <el-drawer
      v-model="drawer"
      title="Detail"
      size="500"
    >
      <JsonViewer
        :value="jsonData"
        copyable
        sort
        :theme="theme"
        expanded
        :expand-depth="1000"
        :preview-mode="false"
      />
    </el-drawer>
  </div>
</template>

<style>
.platform-logs-list {
  background: linear-gradient(to left, var(--bg-bg) 0%, rgba(var(--bg-bg-rgb), 0.8) 50%, var(--bg-bg) 100%);
}
</style>
