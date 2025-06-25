<script setup lang="ts">
import { TraceDetail } from '@/core/madison-addon-trace/core/trace'
import Ruler from './Ruler/index.vue'
import Table from './Table/index.vue'
import MyHeader from './Header/index.vue'

const props = defineProps({
  detail: {
    type: TraceDetail,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})
const detail = props.detail
</script>

<template>
  <div class="pt-2">
    <div>
      <MyHeader
        :id="id"
        :detail="detail"
      />
    </div>
    <div class="flex">
      <Table
        class="w-1/3"
        :detail="detail"
      />
      <Ruler
        class="w-2/3"
        :detail="detail"
      />
    </div>
  </div>
</template>
