<script setup lang="ts">
import item from './item.vue'
import tmr2t from '@/components/TimeRangePicker/tmr2t.vue'
import { Madison } from '@/core/madison'
import type { FullLogs } from '@/core/madison-addon-logs/core/logs'
import { computed, reactive, ref } from 'vue'
import { JsonViewer } from 'vue3-json-viewer'

const madison = Madison.getInstance()
const logs = madison.logs
const logsLoader = logs.data
const searchValue = ref('')
const selectValue = ref('all')
const options = computed<{value: string, label: string}[]>(() => {
  const set = new Set<string>()
  logsLoader.value?.data.forEach((t) => {
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
    return logsList.value.filter((t) => {
      return t.message.includes(searchValue.value) || t.logId.includes(searchValue.value) || t.podName.includes(searchValue.value)
    })
  } else {
    return logsList.value
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
</script>

<template>
  <div>
    <div class="flex gap-4 sticky top-0 p-4 platform-logs-list backdrop-blur z-10">
      <tmr2t
        :manager="logs"
        :query="true"
      />
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
        <span>{{ logsList.length }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-4 p-4">
      <div
        v-show="logsList.length === 0"
        class="w-full flex justify-center items-center h-96"
      >
        <span>No data</span>
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
      v-show="logsList.length > 0"
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
      ，
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
