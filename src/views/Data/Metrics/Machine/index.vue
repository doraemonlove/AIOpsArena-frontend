<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const names = ['metricsmachinenode', 'metricsmachineservice', 'metricsmachinepod', 'metricsmachinetidb']
const sharedQuery = computed(() => ({
  namespace: namespace.value || 'unknown',
  endTime: route.query.endTime,
  range: route.query.range
}))
const dict: Record<string, string> = {
  metricsmachinenode: 'Data.MetricsMachine.Nav.Node',
  metricsmachineservice: 'Data.MetricsMachine.Nav.Service',
  metricsmachinepod: 'Data.MetricsMachine.Nav.Pod',
  metricsmachinetidb: 'Data.MetricsMachine.Nav.TiDB'
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <div class="border-b border-light-border bg-white/70 px-8 py-8 backdrop-blur dark:border-light-border-dark dark:bg-black/10">
      <div class="text-2xl font-semibold tracking-[0.01em] text-slate-800 dark:text-slate-100">
        {{ t('Data.Sidebar.Metrics') }}
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-4 text-base">
        <template
          v-for="(name, index) in names"
          :key="name"
        >
          <router-link
            :to="{ name, query: sharedQuery }"
            class="rounded-full px-5 py-2.5 font-medium transition-all hover:text-moonlight-500"
            :class="route.matched.find((item) => item.name === name) !== undefined
              ? 'bg-moonlight-500 text-white shadow-lg shadow-moonlight-500/20'
              : 'bg-light-fill text-light-2 hover:bg-moonlight-500/10 dark:bg-light-fill-dark dark:text-light-2'"
          >
            {{ t(dict[name]) }}
          </router-link>
          <span
            v-if="index < names.length - 1"
            class="px-1.5 text-sm text-light-2/80 dark:text-light-2/80"
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
