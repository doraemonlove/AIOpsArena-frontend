<script setup lang="ts">
import { FullTrace } from '@/core/madison-addon-traces/core/traces'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  trace: {
    type: FullTrace,
    required: true
  }
})

const model = defineModel({ type: String, required: true  })

const trace =  props.trace
const searchKey =  model

const options: Intl.DateTimeFormatOptions = {
  weekday: undefined,
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}

const { locale } = useI18n()
const tsStr = computed(() => {
  return new Date(trace.timestamp).toLocaleTimeString(locale.value, options)
})
function getDuration(duration: number) {
  const ms = duration / 1000
  if (ms < 1) return Number(duration.toFixed(2)) + 'μs'
  return Number(ms.toFixed(2)) + 'ms'
}

const operationName = computed(() => {
  if (searchKey.value.length === 0) return trace.operationName
  const index = trace.operationName.indexOf(searchKey.value)
  if (index === -1) return trace.operationName
  return trace.operationName.slice(0, index) + '<span class="text-moonlight-500">' + trace.operationName.slice(index, index + searchKey.value.length) + '</span>' + trace.operationName.slice(index + searchKey.value.length)
})

const traceId = computed(() => {
  if (searchKey.value.length === 0) return trace.traceId
  const index = trace.traceId.indexOf(searchKey.value)
  if (index === -1) return trace.traceId
  return trace.traceId.slice(0, index) + '<span class="text-moonlight-500">' + trace.traceId.slice(index, index + searchKey.value.length) + '</span>' + trace.traceId.slice(index + searchKey.value.length)
})
</script>

<template>
  <router-link
    :to="{ name: 'trace', params: {id: trace.traceId}}"
    class="hover:text-moonlight-500 platform-trace-list-item"
  >
    <div class="flex flex-col gap-2 w-full">
      <div>
        <span
          class="text-2xl mr-2"
          v-html="operationName"
        />
        <span
          class="text-gray-400"
          v-html="traceId"
        />
      </div>
      <div class="flex gap-2 text-primary dark:text-primary-dark">
        <div>
          <span>Start time: </span>
          <span>{{ tsStr }}</span>
        </div>
        <el-divider direction="vertical" />
        <div>
          <span>Duration: </span>
          <span>{{ getDuration(trace.duration) }}</span>
        </div>
        <el-divider direction="vertical" />
        <div>
          <span>Status: </span>
          <span>{{ trace.status }}</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style>
.platform-trace-list-item {
  transform: background 0.3s;
  /* background: linear-gradient(to left, rgba(255, 0, 0, 0), rgba(0, 255, 0, 0) 50%, rgba(0, 0, 255, 0)); */
}
.platform-trace-list-item:hover {
  transform: background 0.3s;
  /* background: linear-gradient(to left, rgba(255, 0, 0, 1), rgba(0, 255, 0, 1) 50%, rgba(0, 0, 255, 1)); */
}
</style>
