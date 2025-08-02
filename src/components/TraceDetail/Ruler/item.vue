<script setup lang="ts">
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import { getDuration, getColor } from '../utils'
import { TraceDetailEE } from '../ee'
import { ref } from 'vue'

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  servicesSet: {
    type: Set<string>,
    required: true
  }
})
const detail = props.detail
const duration = props.duration
const timestamp = props.timestamp
const width = detail.duration / duration * 100
const left = (detail.timestamp - timestamp) / duration * 100
const isLeft = left > 50
const isShow = width < 90
const maxShowWidth = (isLeft ? left : 100 - width - left) - 5 < 0 ? 0 : (isLeft ? left : 100 - width - left) - 5
const showPos = isLeft ? 100 - left : left + width
const color = getColor(props.servicesSet, detail.cmdbId)
const selected = ref(false)

TraceDetailEE.getInstance().addListener(`${detail.spanId}-table-enter`, () => {
  selected.value = true
})

TraceDetailEE.getInstance().addListener(`${detail.spanId}-table-leave`, () => {
  selected.value = false
})

function mouseenter() {
  TraceDetailEE.getInstance().emit(`${detail.spanId}-ruler-enter`)
}
function mouseleave() {
  TraceDetailEE.getInstance().emit(`${detail.spanId}-ruler-leave`)
}

</script>

<template>
  <div
    class="w-full relative h-10 box-border text-black/50 dark:text-white/50 hover:text-inherit hover:border-t hover:border-b border-black/30 dark:border-white/50 hover:bg-moonlight-500/10"
    :class="{'text-inherit border-t border-b bg-moonlight-500/10': selected}"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
  >
    <div
      v-if="isLeft && isShow"
      :style="{ '--msw': maxShowWidth + '%', '--sp': showPos + '%' }"
      class="absolute h-full -translate-x-4 flex items-center gap-2 max-w-[--msw] right-[--sp]"
    >
      <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ detail.operationName.replace(' ', '') }}</span>
      <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ getDuration(detail.duration) }}</span>
    </div>
    <div
      v-if="!isLeft && isShow"
      :style="{ '--msw': maxShowWidth + '%', '--sp': showPos + '%' }"
      class="absolute h-full translate-x-4 flex items-center gap-2 max-w-[--msw] left-[--sp]"
    >
      <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ getDuration(detail.duration).replace(' ', '') }}</span>
      <span class="whitespace-nowrap overflow-hidden text-ellipsis">{{ detail.operationName }}</span>
    </div>
    <div
      class="absolute h-full flex items-center text-sm w-[--w] left-[--l]"
      :style="{ '--w': width + '%', '--l': left + '%' }"
    >
      <div class="w-full h-4 relative after:border-l before:border-r after:absolute before:absolute after:left-0 before:right-0 after:h-full before:h-full after:top-0 before:top-0 flex items-center">
        <div
          class="bg-[--bgc] h-2 w-full"
          :style="{'--bgc': color}"
        />
      </div>
    </div>
  </div>
</template>
