<script setup lang="ts">
import { Madison } from '@/core/madison'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title: string
  description: string
  emptyHint?: string
}>()

const route = useRoute()
const { t } = useI18n()
const madison = Madison.getInstance()
const machine = madison.metric.machine
const namespace = machine.namespace
const type = machine.type
const selectedMetricName = machine.selectedMetricName

const detail = computed(() => {
  const ins = madison.metric.getMetricName(namespace.value)
  if (!ins) return null
  return ins.getByType(type.value)
})

const metricGroups = computed(() => detail.value?.data || [])
const currentMetricName = computed(() => (route.query.metricName as string) || '')

function getMetricNameStr(metricName: string, path: string) {
  const metricList = path.split(',').filter((item) => item !== '' && item !== metricName)
  if (!selectedMetricName.value.has(metricName)) {
    metricList.push(metricName)
  }
  return metricList.join(',')
}

function addAll(metricNames: string[], path: string) {
  const set = new Set(path.split(',').filter(Boolean))
  metricNames.forEach((metricName) => set.add(metricName))
  return Array.from(set).join(',')
}

function clearAll() {
  return ''
}
</script>

<template>
  <aside class="rounded-2xl border border-light-border bg-light-fill/70 p-6 dark:border-light-border-dark dark:bg-light-fill-dark/70">
    <div>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
            {{ t('Data.Sidebar.Metrics') }}
          </div>
          <div class="mt-1 text-xl font-semibold">
            {{ props.title }}
          </div>
        </div>
        <router-link
          class="text-sm text-danger hover:underline"
          :to="{ name: route.name, query: { ...route.query, metricName: clearAll() } }"
        >
          {{ t('Data.MetricsMachine.Inspector.Clear') }}
        </router-link>
      </div>

      <div
        v-for="group in metricGroups"
        :key="group.name"
        class="mb-4 rounded-xl border border-light-border dark:border-light-border-dark"
      >
        <div class="flex items-center justify-between border-b border-light-border px-3 py-3 dark:border-light-border-dark">
          <div>
            <div class="text-sm font-medium">{{ group.name }}</div>
            <div class="text-xs text-light-2 dark:text-light-2">{{ t('Data.MetricsMachine.Inspector.MetricsCount', { count: group.metricName.length }) }}</div>
          </div>
          <router-link
            class="text-sm text-moonlight-500 hover:underline"
            :to="{ name: route.name, query: { ...route.query, metricName: addAll(group.metricName, currentMetricName) } }"
          >
            {{ t('Data.MetricsMachine.Inspector.AddAll') }}
          </router-link>
        </div>

        <div class="max-h-72 overflow-auto p-2">
          <router-link
            v-for="metric in group.metricName"
            :key="metric"
            class="mb-1 flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-moonlight-500/10"
            :class="selectedMetricName.has(metric) ? 'bg-moonlight-500/10 text-moonlight-500' : ''"
            :to="{ name: route.name, query: { ...route.query, metricName: getMetricNameStr(metric, currentMetricName) } }"
          >
            <span class="pr-3 break-all">{{ metric }}</span>
            <span class="shrink-0 text-xs uppercase tracking-wide">
              {{ selectedMetricName.has(metric)
                ? t('Data.MetricsMachine.Inspector.Remove')
                : t('Data.MetricsMachine.Inspector.Add') }}
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </aside>
</template>
