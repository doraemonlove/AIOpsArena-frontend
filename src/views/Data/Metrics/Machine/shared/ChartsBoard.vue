<script setup lang="ts">
import { Madison } from '@/core/madison'
import chart from '@/views/Data/Metric/Machine/chart.vue'
import loading from '@/views/Data/Metric/Machine/loading.vue'

const props = defineProps<{
  emptyMessage: string
}>()

const data = Madison.getInstance().metric.machine.data
</script>

<template>
  <section class="mt-8 px-3 pb-6">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
          Charts
        </div>
        <div class="text-2xl font-semibold">
          Metric Trends
        </div>
      </div>
      <div class="text-sm text-light-2 dark:text-light-2">
        {{ data.length }} selected
      </div>
    </div>

    <div
      v-if="data.length === 0"
      class="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-light-border bg-light-fill/40 px-8 text-center text-xl dark:border-light-border-dark dark:bg-light-fill-dark/40"
    >
      <span>{{ props.emptyMessage }}</span>
    </div>

    <div
      v-else
      class="flex flex-col gap-4"
    >
      <div
        v-for="d in data"
        :key="d.id"
        class="metric-chart-card overflow-hidden rounded-2xl border border-light-border bg-light-fill/40 p-2 dark:border-light-border-dark dark:bg-light-fill-dark/40"
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
    </div>
  </section>
</template>

<style scoped>
.metric-chart-card {
  height: 840px;
  min-height: 840px;
}
</style>
