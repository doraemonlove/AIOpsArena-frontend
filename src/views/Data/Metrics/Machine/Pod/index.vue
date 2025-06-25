<script setup lang="ts">
import { Madison } from '@/core/madison'
import { ref, onMounted, onUnmounted } from 'vue'
import selected from './selected.vue'

const madison = Madison.getInstance()
const pod = madison.metrics.machine.pod

const chart = ref<HTMLDivElement | null>(null)
const renderSuccess = pod.renderSuccess

onMounted(() => {
  if (chart.value) {
    pod.render(chart.value)
  }
})

onUnmounted(() => {
  pod.distory()
})

</script>

<template>
  <div class="h-full relative p-4 box-border">
    <div
      ref="chart"
      class="size-full"
    />
    <div
      v-show="!renderSuccess"
      class="absolute top-0 left-0 size-full flex justify-center items-center flex-col gap-2"
    >
      <span class="text-red-500 text-4xl">
        Display ERROR
      </span>
      <span class="text-lg">
        It could be a namespace error or a server error
      </span>
    </div>
    <selected />
  </div>
</template>
