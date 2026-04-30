<script setup lang="ts">
import { Madison } from '@/core/madison'
import item from './item.vue'
import type { Microservice } from '@/core/madison-addon-testbed'

const props = withDefaults(defineProps<{
  showAction?: boolean,
  actionText?: string
}>(), {
  showAction: false,
  actionText: ''
})
const emit = defineEmits<{
  (e: 'select', microservice: Microservice): void
}>()

const madison = Madison.getInstance()
const microservice = madison.testbed.microservices
</script>

<template>
  <div class="h-full overflow-auto">
    <div class="microservice-list p-8">
      <!-- <item
      v-for="m, i in Array(26)"
      :key="i"
      :microservice="microservice[0]"
    /> -->
      <item
        v-for="m, i in microservice"
        :key="i"
        :microservice="m"
        :show-action="props.showAction"
        :action-text="props.actionText"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.microservice-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  column-gap: clamp(32px, 8%, 120px);
  row-gap: clamp(24px, 4%, 56px);
}

@media (max-width: 900px) {
  .microservice-list {
    justify-content: center;
  }
}
</style>
