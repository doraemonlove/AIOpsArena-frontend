<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const names = ['metricsmachinenode', 'metricsmachineservice', 'metricsmachinepod', 'metricsmachinetidb']
const sharedQuery = computed(() => ({
  namespace: namespace.value || 'unknown',
  endTime: route.query.endTime,
  range: route.query.range
}))
const dict: Record<string, string> = {
  metricsmachinenode: 'Node',
  metricsmachineservice: 'Service',
  metricsmachinepod: 'Pod',
  metricsmachinetidb: 'TiDB'
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <div class="border-b border-light-border bg-white/70 px-8 py-6 backdrop-blur dark:border-light-border-dark dark:bg-black/10">
      <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
        Metrics
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <template
          v-for="(name, index) in names"
          :key="name"
        >
          <router-link
            :to="{ name, query: sharedQuery }"
            class="rounded-full px-4 py-2 transition-all hover:text-moonlight-500"
            :class="route.matched.find((item) => item.name === name) !== undefined
              ? 'bg-moonlight-500 text-white shadow-lg shadow-moonlight-500/20'
              : 'bg-light-fill text-light-2 hover:bg-moonlight-500/10 dark:bg-light-fill-dark dark:text-light-2'"
          >
            {{ dict[name] }}
          </router-link>
          <span
            v-if="index < names.length - 1"
            class="text-light-2 dark:text-light-2"
          >
            /
          </span>
        </template>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-auto">
      <router-view />
    </div>
  </div>
</template>
