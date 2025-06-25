<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
const route = useRoute()
const type = computed(() => {
  if (typeof route.name === 'string') {
    if (route.matched.find((item) => item.name === 'metrics') !== undefined) {
      return 'Metrics'
    }
    return route.name[0].toLocaleUpperCase() + route.name.slice(1)
  }
  return 'unknown'
})
const types = ['logs', 'metrics', 'traces']
const namespace = Madison.getInstance().namespace.paramNamespace

</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-2xl hover:text-moonlight-500 hover:underline">
        <router-link :to="{ name: 'datatype', params: { namespace: namespace || 'unknown' }}">
          Select Type
        </router-link>
      </span>
    </div>
    <div>
      <span class="text-gray-400">Now Type</span>
    </div>
    <div>
      <div class="text-center text-moonlight-500">{{ type }}</div>
    </div>
    <div>
      <span class="text-gray-400">Your Types</span>
    </div>
    <div
      v-for="t, i in types"
      :key="i"
    >
      <router-link
        :to="{ name: t, params: route.params }"
        class="hover:text-moonlight-500 hover:underline"
      >
        {{ t[0].toLocaleUpperCase() + t.slice(1) }}
      </router-link>
    </div>
  </div>
</template>
