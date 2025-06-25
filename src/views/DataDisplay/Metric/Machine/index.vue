<script setup lang="ts">
import MetricMachineSidebar from '@/components/MetricMachineSidebar/index.vue'
import { Madison } from '@/core/madison'
import chart from './chart.vue'

const madison = Madison.getInstance()
const machine = madison.metric.machine
const namesapce = machine.namespace
const startTime = machine.startTime
const endTime = machine.endTime
const smn = machine.selectedMetricName
const data = machine.data
</script>

<template>
  <div class="relative">
    <MetricMachineSidebar />
    <!-- <div class="flex justify-center p-4 fixed top-16 w-full">
      <div class="max-w-screen-lt w-full flex gap-4">
        <div>
          <span>Namespace: {{ namesapce }}</span>
        </div>
      </div>
    </div> -->
    <div class="flex flex-col gap-4 p-4 justify-center">
      <chart
        v-for="d in data"
        :key="d.id"
        :data="d"
      />
      <div
        v-if="data.length === 0"
        class="flex justify-center items-center w-full h-[500px] flex-shrink-0 text-3xl"
      >
        <span>Click the <span class="text-[#FF87C8]">left button</span> to select metric name</span>
      </div>
    </div>
  </div>
</template>
