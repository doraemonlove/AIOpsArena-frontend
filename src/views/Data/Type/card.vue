<script setup lang="ts">
import { Madison } from '@/core/madison'
import { computed } from 'vue'
const namespace = Madison.getInstance().namespace
type Types = 'logs' | 'metrics' | 'traces'
const props = defineProps({
  type: {
    type: String as () => Types,
    required: true
  }
})

const title = props.type[0].toLocaleUpperCase() + props.type.slice(1)
const to = computed(() => {
  return { name: props.type, params: { namespace: namespace.paramNamespace.value || 'unknown' }}
})

</script>

<template>
  <router-link :to="to">
    <div>
      <span>{{ title }}</span>
    </div>
  </router-link>
</template>
