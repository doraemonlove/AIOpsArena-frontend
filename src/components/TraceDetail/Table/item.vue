<script setup lang="ts">
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import { getColor } from '../utils'
import item from './item.vue'
import { ref } from 'vue'
import { TraceDetailEE } from '../ee'

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  },
  servicesSet: {
    type: Set<string>,
    required: true
  }
})
const detail = props.detail
const servicesSet = props.servicesSet
const color = getColor(servicesSet, detail.cmdbId)
const selected = ref(false)

TraceDetailEE.getInstance().addListener(`${detail.spanId}-ruler-enter`, () => {
  selected.value = true
})

TraceDetailEE.getInstance().addListener(`${detail.spanId}-ruler-leave`, () => {
  selected.value = false
})

function mouseenter() {
  TraceDetailEE.getInstance().emit(`${detail.spanId}-table-enter`)
}
function mouseleave() {
  TraceDetailEE.getInstance().emit(`${detail.spanId}-table-leave`)
}
</script>

<template>
  <div class="flex flex-col gap-2 relative">
    <div class="absolute h-full border-l" />
    <div class="h-10 relative z-10">
      <div
        class="absolute h-full bg-[--bgc] w-[4px]"
        :style="{ '--bgc': color }"
      />
      <div
        class="pr-2 pl-4 box-border mt-[1px] h-[38px] min-w-full hover:w-fit whitespace-nowrap overflow-hidden text-ellipsis hover:overflow-visible leading-10 hover:bg-moonlight-99 dark:hover:bg-moonlight-999 hover:border-r border-black/30 dark:border-white/50 "
        :class="{'platform-trace-detail-table-item__selected': selected}"
        @mouseenter="mouseenter"
        @mouseleave="mouseleave"
      >
        {{ detail.operationName }}
      </div>
    </div>
    <item
      v-for="d, i in detail.children"
      :key="i"
      class="pl-6"
      :detail="d"
      :services-set="servicesSet"
    />
  </div>
</template>

<style>
.platform-trace-detail-table-item__selected {
  background: linear-gradient(to left, #75C3FF40, transparent 50%, transparent);
}
</style>
