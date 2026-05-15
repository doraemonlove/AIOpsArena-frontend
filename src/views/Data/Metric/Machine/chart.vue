<script setup lang="ts">
import { Madison } from '@/core/madison'
import { MetriMachineDataDetail } from '@/core/madison-addon-metric/core/machine/data'
import s2e from '@/components/MetricMachineSidebar/s2e.vue'
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  data: {
    type: MetriMachineDataDetail,
    required: true
  }
})

const { t } = useI18n()
const chart = ref<HTMLDivElement | null>(null)
const machine = Madison.getInstance().metric.machine

async function waitForChartReady(maxRetries: number = 10) {
  await nextTick()
  for (let i = 0; i < maxRetries; i++) {
    const element = chart.value
    if (element && element.clientWidth > 0 && element.clientHeight > 0) {
      return element
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  return chart.value
}

async function renderChart() {
  const element = await waitForChartReady()
  if (element && element.clientWidth > 0 && element.clientHeight > 0) {
    props.data.render(element)
    requestAnimationFrame(() => {
      props.data.resizeChart()
    })
  }
}

onMounted(() => {
  renderChart()
})

watch(
  () => props.data.id,
  () => {
    renderChart()
  }
)

watch(
  () => chart.value,
  (value) => {
    if (value) {
      renderChart()
    }
  }
)

onBeforeUnmount(() => {
  props.data.distory()
})
</script>

<template>
  <div class="metric-chart-panel flex h-full w-full flex-col overflow-hidden">
    <div
      v-if="!props.data.empty"
      class="shrink-0 px-8 pb-10 pt-7"
    >
      <div class="mb-8 text-center text-lg font-semibold">
        {{ props.data.name }}
      </div>
      <div class="inline-flex">
        <s2e
          :manager="machine"
          size="small"
        />
      </div>
    </div>
    <div
      v-if="!props.data.empty"
      ref="chart"
      class="metric-chart-canvas block w-full shrink-0 overflow-hidden"
    />
    <div
      v-if="!props.data.empty"
      class="min-h-0 flex-1 overflow-auto px-8 pb-5 pt-5"
    >
      <div class="space-y-2 text-sm">
        <div
          v-for="item in props.data.legendItems"
          :key="item.name"
          class="flex min-w-0 cursor-pointer items-start gap-3 rounded-md px-2 py-1 transition hover:bg-light-fill dark:hover:bg-light-fill-dark"
          :class="item.selected ? '' : 'opacity-40'"
          @click="props.data.toggleSeries(item.name)"
        >
          <span
            class="legend-swatch mt-1.5 shrink-0 rounded-sm ring-1 ring-black/10"
            :style="{ backgroundColor: item.color }"
          />
          <span class="break-all leading-5">{{ item.name }}</span>
        </div>
      </div>
    </div>
    <div
      v-else
      class="block w-full h-full min-h-[600px] overflow-hidden flex flex-col gap-4 justify-center items-center"
    >
      <span class="text-2xl">{{ props.data.name }}</span>
      <span class="text-red-500 text-2xl">
        {{ t('Data.Metric.Empty') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.metric-chart-panel {
  min-height: 820px;
}

.metric-chart-canvas {
  height: 520px;
  min-height: 520px;
}

.legend-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
}
</style>
