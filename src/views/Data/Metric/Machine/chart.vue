<script setup lang="ts">
import { MetriMachineDataDetail } from '@/core/madison-addon-metric/core/machine/data'
import { onMounted, ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  data: {
    type: MetriMachineDataDetail,
    required: true
  }
})

const data = props.data
const chart = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (chart.value) {
    data.render(chart.value)
  }
})

onBeforeUnmount(() => {
  data.distory()
})
</script>

<template>
  <div
    ref="chart"
    class="w-full h-full overflow-hidden"
  />
</template>
