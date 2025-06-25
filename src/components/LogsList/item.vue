<script setup lang="ts">
import { FullLogs } from '@/core/madison-addon-logs/core/logs'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  log: {
    type: FullLogs,
    required: true
  }
})

const model = defineModel({ type: String, required: true  })

const emits = defineEmits(['showDetail'])

const log =  props.log
const searchKey =  model

const options: Intl.DateTimeFormatOptions = {
  weekday: undefined,
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}

const { locale } = useI18n()
const tsStr = computed(() => {
  return new Date(log.timestamp).toLocaleTimeString(locale.value, options)
})

const message = computed(() => {
  if (searchKey.value.length === 0) return log.message
  const index = log.message.indexOf(searchKey.value)
  if (index === -1) return log.message
  return log.message.slice(0, index) + '<span class="text-moonlight-500">' + log.message.slice(index, index + searchKey.value.length) + '</span>' + log.message.slice(index + searchKey.value.length)
})

const logId = computed(() => {
  if (searchKey.value.length === 0) return log.logId
  const index = log.logId.indexOf(searchKey.value)
  if (index === -1) return log.logId
  return log.logId.slice(0, index) + '<span class="text-moonlight-500">' + log.logId.slice(index, index + searchKey.value.length) + '</span>' + log.logId.slice(index + searchKey.value.length)
})

const podName = computed(() => {
  if (searchKey.value.length === 0) return log.podName
  const index = log.podName.indexOf(searchKey.value)
  if (index === -1) return log.podName
  return log.podName.slice(0, index) + '<span class="text-moonlight-500">' + log.podName.slice(index, index + searchKey.value.length) + '</span>' + log.podName.slice(index + searchKey.value.length)
})

function showDetail() {
  emits('showDetail', log)
}
</script>

<template>
  <div
    class="hover:text-moonlight-500 platform-logs-list-item"
  >
    <div class="flex flex-col gap-2 w-full">
      <div class="flex justify-between gap-2 items-center">
        <div>
          <span
            class="text-2xl mr-2"
            v-html="logId"
          />
          <span
            class="text-gray-400"
            v-html="podName"
          />
        </div>
        <div>
          <el-button
            size="small"
            @click="showDetail"
          >
            Detail
          </el-button>
        </div>
      </div>
      <div class="flex gap-2 text-primary dark:text-primary-dark">
        <div class="w-fit flex-shrink-0">
          <span>Timestamp: </span>
          <span>{{ tsStr }}</span>
        </div>
        <el-divider direction="vertical" />
        <el-popover
          raw-content
          :width="500"
        >
          <template #reference>
            <div class=" overflow-hidden text-ellipsis whitespace-nowrap">
              <span>Message: </span>
              <span v-html="message" />
            </div>
          </template>
          <span v-html="message" />
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style>
.platform-logs-list-item {
  transform: background 0.3s;
  /* background: linear-gradient(to left, rgba(255, 0, 0, 0), rgba(0, 255, 0, 0) 50%, rgba(0, 0, 255, 0)); */
}
.platform-logs-list-item:hover {
  transform: background 0.3s;
  /* background: linear-gradient(to left, rgba(255, 0, 0, 1), rgba(0, 255, 0, 1) 50%, rgba(0, 0, 255, 1)); */
}
</style>
