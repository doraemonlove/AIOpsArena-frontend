<script setup lang="ts">
import MetricMachineSidebar from '@/components/MetricMachineSidebar/index.vue'
import { Madison } from '@/core/madison'
import chart from './chart.vue'
import loading from './loading.vue'

const madison = Madison.getInstance()
const machine = madison.metric.machine
const namesapce = machine.namespace
const startTime = machine.displayStartTime
const endTime = machine.displayEndTime
const smn = machine.selectedMetricName
const data = machine.data
</script>

<template>
  <div class="relative">
    <MetricMachineSidebar />
    <div class="flex flex-col gap-4 pt-4 justify-center">
      <div
        v-for="d in data"
        :key="d.id"
        class="w-full h-[700px] overflow-hidden"
      >
        <chart
          v-if="d.data !== null"
          :data="d.data"
        />
        <loading v-else />
      </div>
      <div
        v-if="data.length === 0"
        class="flex justify-center items-center w-full h-[500px] flex-shrink-0 text-3xl"
      >
        <span>Click the <span class="text-[#FF87C8]">left button</span> to select metric name</span>
      </div>
    </div>
  </div>
</template>
