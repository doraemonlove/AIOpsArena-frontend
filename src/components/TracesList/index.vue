<script setup lang="ts">
import item from './item.vue'
import tmr2t from '@/components/TimeRangePicker/tmr2t.vue'
import { Madison } from '@/core/madison'
import { computed, ref } from 'vue'

const madison = Madison.getInstance()
const tracesList = madison.traces.data
const traces = madison.traces

const searchValue = ref('')

const sortValue = ref('sort1')
const options = [
  {
    value: 'sort1',
    label: 'Most Recent'
  },
  {
    value: 'sort2',
    label: 'Longest First'
  },
  {
    value: 'sort3',
    label: 'Shortest First'
  }
]

const searchedTracesList = computed(() => {
  if (searchValue.value !== '') {
    return tracesList.value.filter((t) => {
      return t.operationName.includes(searchValue.value) || t.traceId.includes(searchValue.value)
    })
  } else {
    return tracesList.value
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

</script>

<template>
  <div>
    <div class="flex gap-4 sticky top-0 p-4 platform-trace-list backdrop-blur z-10">
      <tmr2t
        :manager="traces"
        :query="true"
      />
      <div>
        <el-input
          v-model="searchValue"
          style="width: 240px;"
          placeholder="Search operation name, trace ID"
        />
      </div>
      <div class="flex items-center gap-2">
        <span>Sort:</span>
        <el-select
          v-model="sortValue"
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
        <span>{{ useTracesList.length }}</span>
        <span>/</span>
        <span>{{ tracesList.length }}</span>
      </div>
      <div class="flex items-center">
        <el-button>
          <router-link :to="{ name: 'tracesearch'}">
            <span>Goto query trace ID</span>
          </router-link>
        </el-button>
      </div>
    </div>
    <div class="flex flex-col gap-4 p-4">
      <div
        v-show="tracesList.length === 0"
        class="w-full flex justify-center items-center h-96"
      >
        <span>No data</span>
      </div>
      <item
        v-for="t in showTracesList"
        :key="t.traceId"
        v-model="searchValue"
        :trace="t"
      />
    </div>
    <div
      v-show="tracesList.length > 0"
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
