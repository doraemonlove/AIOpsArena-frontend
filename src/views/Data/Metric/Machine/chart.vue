<script setup lang="ts">
import { MetriMachineDataDetail } from '@/core/madison-addon-metric/core/machine/data'
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  data: {
    type: MetriMachineDataDetail,
    required: true
  }
})

const { t } = useI18n()
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
  <div class="w-full h-full overflow-hidden">
    <div
      v-if="!data.empty"
      ref="chart"
      class="w-full h-full overflow-hidden"
    />
    <div
      v-else
      class="w-full h-full overflow-hidden flex flex-col gap-4 justify-center items-center"
    >
      <span class="text-2xl">{{ data.name }}</span>
      <span class="text-red-500 text-2xl">
        {{ t('Data.Metric.Empty') }}
      </span>
    </div>
  </div>
</template>
