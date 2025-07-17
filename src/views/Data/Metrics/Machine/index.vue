<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'

const route = useRoute()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const names = ['metricsmachinenode', 'metricsmachinepod']
const dict: Record<string, string> = {
  metricsmachinenode: 'Node',
  metricsmachinepod: 'Pod'
}
</script>

<template>
  <div class="h-full flex">
    <div class="flex gap-4 justify-center flex-col h-full w-16 pl-2 pr-2 box-border border-r border-light-border dark:border-light-border-dark">
      <div
        v-for="name in names"
        :key="name"
      >
        <router-link
          :to="{ name, query: { namespace: namespace || 'unknown' }}"
          class="w-auto box-border border-b-2 border-transparent hover:text-moonlight-500 transition-all"
          :class="{ '!border-moonlight-500': route.matched.find((item) => item.name === name) !== undefined }"
        >
          <span>
            {{ dict[name] }}
          </span>
        </router-link>
      </div>
    </div>
    <div
      class=" flex-shrink-0"
      style="width: calc(100% - 64px);"
    >
      <router-view />
    </div>
  </div>
</template>
