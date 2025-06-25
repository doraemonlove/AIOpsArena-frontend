<script setup lang="ts">
import { Microservice } from '@/core/madison-addon-testbed'
import { Madison } from '@/core/madison'
import { computed } from 'vue'

const props = defineProps({
  microservice: {
    type: Microservice,
    required: true
  }
})
const emits = defineEmits<{
  create: [microservice: Microservice]
}>()

const microservice = props.microservice
const madison = Madison.getInstance()
const canCreate = madison.testbed.canCreate

console.log(canCreate.value, madison.testbed.maxTestbeds.value, madison.testbed.usedTestbeds.value)

function create() {
  emits('create', microservice)
}

</script>

<template>
  <div class="h-36 rounded-lg p-4 hover:cursor-pointer hover:shadow-lg hover:shadow-moonlight-500/50 hover:text-moonlight-500 transition-all duration-300 flex flex-col justify-between">
    <div>
      <span class="font-serif font-bold text-xl">{{ microservice.name }}</span>
    </div>
    <div class="flex justify-end">
      <el-button
        :disabled="!canCreate"
        @click="create"
      >部署</el-button>
    </div>
  </div>
</template>
