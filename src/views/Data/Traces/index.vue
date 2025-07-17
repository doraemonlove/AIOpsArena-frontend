<script setup lang="ts">
import TracesList from '@/components/TracesList/index.vue'
import QueryTaskCreator from '@/components/QueryTaskCreator/index.vue'
import QueryTaskList from '@/components/QueryTaskList/index.vue'
import { useMadison } from '@/core/madison'
const madison = useMadison()
const traces = madison.traces
const trace = traces.data
</script>

<template>
  <div class="flex gap-4 justify-between h-full relative overflow-auto">
    <div style="width: calc(100% - 280px);">
      <QueryTaskCreator
        v-show="trace === null"
        :manager="traces"
        type="t2r"
        display="block"
      />
      <TracesList v-show="trace !== null" />
    </div>
    <QueryTaskList
      :manager="traces"
      type="t2r"
    />
  </div>
</template>
