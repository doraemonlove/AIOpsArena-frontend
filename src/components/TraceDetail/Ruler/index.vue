<script setup lang="ts">
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import item from './item.vue'
import { getDuration, getDetails, getServices } from '../utils'

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  }
})
const span = props.detail
const details = getDetails(span)
const servicesSet = getServices(details)
const duration = span.duration
const durations = [0, duration / 4, duration / 2, duration / 4 * 3, duration]

</script>

<template>
  <div>
    <div class="flex flex-col relative">
      <div class="flex justify-between bg-darker-fill dark:bg-darker-fill-dark">
        <div
          v-for="d, i in durations"
          :key="i"
          class="w-0 platform-ruler-item box-border border-l border-l-darker-border dark:border-l-darker-border-dark pt-2 pb-2"
        >
          <span class="ml-2 text-sm">{{ getDuration(d) }}</span>
        </div>
      </div>
      <div class="relative">
        <div class="w-full h-full absolute flex justify-between select-none -z-10">
          <div
            v-for="i in 5"
            :key="i"
            class="box-border border-l border-l-darker-border dark:border-l-darker-border-dark h-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <item
            v-for="d, i in details"
            :key="i"
            :detail="d"
            :duration="span.duration"
            :timestamp="span.timestamp"
            :services-set="servicesSet"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.platform-ruler-item:last-child > span {
  float: right;
  margin-left: 0;
  margin-right: 8px;
}
</style>
