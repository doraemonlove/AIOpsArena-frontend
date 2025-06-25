<script setup lang="ts">
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import item from './item.vue'
import { getDetails, getServices } from '../utils'
import { onBeforeMount } from 'vue'
import { TraceDetailEE } from '../ee'

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  }
})
const detail = props.detail
const details = getDetails(detail)
const servicesSet = getServices(details)

onBeforeMount(() => {
  TraceDetailEE.getInstance().destroyed()
})

</script>

<template>
  <div>
    <div class="h-10 flex items-center bg-darker-fill dark:bg-darker-fill-dark pl-2">
      <span class="text-xl font-bold text-moonlight-400 ">Service & Operation</span>
    </div>
    <div class="pl-2">
      <item
        :detail="detail"
        :services-set="servicesSet"
      />
    </div>
  </div>
</template>
