<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import SelectNamespace from './SelectNamespace/index.vue'
import SelectType from './SelectType/index.vue'

const route = useRoute()
const show = computed(() => route.matched.find((item) => item.name === 'datanamespace') !== undefined)
const showNamespaceSelect = computed(() => route.matched.find((item) => item.name === 'datanamespace') !== undefined)
const showTypeSelect = computed(() => route.matched.find((item) => item.name === 'traces' || item.name === 'logs' || item.name === 'metrics') !== undefined)
</script>

<template>
  <div
    v-show="show"
    class="w-64 flex flex-col gap-4 sticky top-0 p-4"
  >
    <SelectNamespace v-if="showNamespaceSelect" />
    <SelectType v-if="showTypeSelect" />
  </div>
</template>
