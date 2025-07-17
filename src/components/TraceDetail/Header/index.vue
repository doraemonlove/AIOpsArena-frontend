<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import { computed } from 'vue'
import { getDuration, getDetails, getDepth, getServices } from '../utils'
import { message } from '@/utils/utils'
import { Madison } from '@/core/madison'
const namespace = Madison.getInstance().namespace.paramNamespace
const to = computed(() => {
  if (namespace.value === '') {
    return { name: 'data' }
  } else {
    return { name: 'traces', query: { namespace: namespace.value }}
  }
})

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})

const detail = props.detail
const details = getDetails(detail)
const id = props.id
const timestamp = detail.timestamp // us
const duration = detail.duration // us
const operationName = detail.operationName
const options: Intl.DateTimeFormatOptions = {
  weekday: undefined,
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}

const { locale } = useI18n()
const tsStr = computed(() => {
  return new Date(timestamp / 1000).toLocaleDateString(locale.value, options)
})

const servicesSet = getServices(details)

const servicesNum = servicesSet.size
const depth = getDepth(detail)
const totalSpans = details.length

function copy() {
  navigator.clipboard.writeText(id).then(() => {
    message('Copied!', 'success')
  }).catch((err) => {
    alert('复制失败，请检查浏览器权限。')
    console.error('Failed to copy text: ', err)
  })
}

function copyURL() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    message('Copied!', 'success')
  }).catch((err) => {
    alert('复制失败，请检查浏览器权限。')
    console.error('Failed to copy text: ', err)
  })
}

</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 items-center justify-between pr-2 pl-2">
      <div class="flex gap-2 items-end">
        <span class="text-4xl">{{ operationName }}</span>
        <span
          class="text-2xl text-gray-400 cursor-pointer"
          title="Copy trace id"
          @click="copy"
        >{{ id }}</span>
      </div>
      <div class="flex items-center gap-2">
        <el-button
          plain
          size="small"
        >
          <router-link :to="to">To traces</router-link>
        </el-button>
        <el-button
          plain
          size="small"
          @click="copyURL"
        >
          <span>Copy URL</span>
        </el-button>
      </div>
    </div>
    <div class="flex gap-1 items-center bg-moonlight-500/10 p-1 pr-2 pl-2 border-t border-b hover:border-b border-black/30 dark:border-white/50">
      <div>
        <span>Trace start: </span>
        <span>{{ tsStr }}</span>
      </div>
      <el-divider direction="vertical" />
      <div>
        <span>Duration: </span>
        <span>{{ getDuration(duration) }}</span>
      </div>
      <el-divider direction="vertical" />
      <div>
        <span>Services: </span>
        <span>{{ servicesNum }}</span>
      </div>
      <el-divider direction="vertical" />
      <div>
        <span>Depth: </span>
        <span>{{ depth }}</span>
      </div>
      <el-divider direction="vertical" />
      <div>
        <span>Total spans: </span>
        <span>{{ totalSpans }}</span>
      </div>
    </div>
  </div>
</template>
