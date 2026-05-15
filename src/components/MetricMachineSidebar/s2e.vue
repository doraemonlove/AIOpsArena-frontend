<script setup lang="ts">
import type { Machine } from '@/core/madison-addon-metric/core/machine'
import { computed } from 'vue'

const props = defineProps<{
  manager: Machine,
  size?: 'large' | 'default' | 'small',
  query?: boolean
}>()
const manager = props.manager
const size = props.size || 'default'

const endTime = manager.endTime
const rangeKey = manager.selectedRangeKey
const rangeOptions = manager.rangeOptions
const disable = manager.isCreatingQueryTask

function disabledDate(date: Date) {
  return date.getTime() > Date.now()
}

const rangeLabel = computed(() => {
  return rangeOptions.value.find((item) => item.key === rangeKey.value)?.label || rangeKey.value
})

function runQuery() {
  manager.refreshMetricDataInPlace()
}

function moveRange(direction: -1 | 1) {
  manager.shiftRange(direction)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-light-border bg-white shadow-sm dark:border-light-border-dark dark:bg-black/10">
      <button
        class="inline-flex h-9 w-9 items-center justify-center border-r border-light-border text-lg text-light-2 transition hover:bg-light-fill hover:text-moonlight-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-light-border-dark dark:hover:bg-light-fill-dark"
        type="button"
        :disabled="disable"
        @click="moveRange(-1)"
      >
        -
      </button>
      <div class="inline-flex min-w-[56px] items-center justify-center px-3 text-sm font-medium">
        {{ rangeLabel }}
      </div>
      <button
        class="inline-flex h-9 w-9 items-center justify-center border-l border-light-border text-lg text-light-2 transition hover:bg-light-fill hover:text-moonlight-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-light-border-dark dark:hover:bg-light-fill-dark"
        type="button"
        :disabled="disable"
        @click="moveRange(1)"
      >
        +
      </button>
    </div>

    <div class="inline-flex min-w-0 shrink items-center overflow-hidden rounded-md border border-light-border bg-white shadow-sm dark:border-light-border-dark dark:bg-black/10">
      <button
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center border-r border-light-border text-lg text-light-2 transition hover:bg-light-fill hover:text-moonlight-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-light-border-dark dark:hover:bg-light-fill-dark"
        type="button"
        :disabled="disable"
        @click="manager.shiftEndTime(-1)"
      >
        &lt;
      </button>
      <el-date-picker
        v-model="endTime"
        :size="size"
        type="datetime"
        placeholder="End time"
        :disabled-date="disabledDate"
        :clearable="false"
        class="s2e-endtime"
        @change="runQuery"
      />
      <button
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center border-l border-light-border text-lg text-light-2 transition hover:bg-light-fill hover:text-moonlight-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-light-border-dark dark:hover:bg-light-fill-dark"
        type="button"
        :disabled="disable"
        @click="manager.shiftEndTime(1)"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.s2e-endtime) {
  width: 220px;
  max-width: calc(100vw - 120px);
}

:deep(.s2e-endtime .el-input__wrapper) {
  min-height: 36px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

:deep(.s2e-endtime .el-input__prefix) {
  color: var(--el-text-color-secondary);
}

:deep(.s2e-endtime .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

:deep(.s2e-endtime .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style>
