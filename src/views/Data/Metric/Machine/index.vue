<script setup lang="ts">
import MetricMachineSidebar from '@/components/MetricMachineSidebar/index.vue'
import { Madison } from '@/core/madison'
import chart from './chart.vue'
import loading from './loading.vue'

const madison = Madison.getInstance()
const machine = madison.metric.machine
const data = machine.data
</script>

<template>
  <div class="h-full flex gap-6 p-4 box-border">
    <div class="w-[320px] h-full shrink-0 sticky top-0 self-start">
      <MetricMachineSidebar />
    </div>
    <div class="flex-1 min-w-0 h-full overflow-auto">
      <div class="flex flex-col gap-4 justify-center">
        <div
          v-for="d in data"
          :key="d.id"
          class="w-full h-[700px] overflow-hidden rounded-2xl border border-light-border bg-light-fill/40 p-2 dark:border-light-border-dark dark:bg-light-fill-dark/40"
        >
          <chart
            v-if="d.data !== null"
            class="block h-full w-full"
            :data="d.data"
          />
          <loading
            v-else
            class="block h-full w-full"
          />
        </div>
        <div
          v-if="data.length === 0"
          class="flex min-h-[500px] w-full items-center justify-center rounded-2xl border border-dashed border-light-border bg-light-fill/30 px-10 text-center text-2xl dark:border-light-border-dark dark:bg-light-fill-dark/30"
        >
          <span>Select metrics from the left sidebar to start exploring charts</span>
        </div>
      </div>
    </div>
  </div>
</template>
