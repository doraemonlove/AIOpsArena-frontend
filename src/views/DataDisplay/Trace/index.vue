<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Madison } from '@/core/madison'
import TraceDetail from '@/components/TraceDetail/index.vue'
import type { TraceDetail as TraceDetailMadison } from '@/core/madison-addon-trace/core/trace'

const route = useRoute()
const id = route.params.id as string
const detail = Madison.getInstance().trace.getTrace(id)
const error = detail === undefined
const useDetail = detail as TraceDetailMadison

</script>

<template>
  <div>
    <div v-if="!error">
      <TraceDetail
        :id="id"
        :detail="useDetail"
      />
    </div>
    <div v-else>
      <div class="flex justify-center items-center pt-40 break-words">
        <span class="text-6xl">Trace <span class="text-3xl text-red-500">{{ id }}</span> not found</span>
      </div>
    </div>
  </div>
</template>
