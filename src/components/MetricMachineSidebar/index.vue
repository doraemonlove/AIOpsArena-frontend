<script setup lang="ts">
import { Madison } from '@/core/madison'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import s2e from './s2e.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const madison = Madison.getInstance()
const machine = madison.metric.machine
const namespace = machine.namespace
const type = machine.type
const selectedMetricName = machine.selectedMetricName
const nodeOrPodList = machine.nodeOrPodList

const metricNameMachine = computed(() => {
  const ins = madison.metric.getMetricName(namespace.value)
  if (ins) return ins.machine
  return null
})

const metricName = computed(() => {
  if (metricNameMachine.value) {
    return metricNameMachine.value[type.value]
  }
  return null
})

const metricNameData = computed(() => {
  if (metricName.value) {
    return metricName.value.data
  }
  return []
})

const currentMetricName = computed(() => (route.query.metricName as string) || '')
const currentTarget = computed(() => {
  return type.value === 'node' ? route.query.node : route.query.pod
})

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

function removeAll(metricNames: string[], path: string) {
  const set = new Set(path.split(',').filter(Boolean))
  metricNames.forEach((metricName) => set.delete(metricName))
  return Array.from(set).join(',')
}

function addAllAll() {
  const list: string[] = []
  metricNameData.value.forEach((group) => {
    group.metricName.forEach((metricName) => {
      list.push(metricName)
    })
  })
  return Array.from(new Set(list)).join(',')
}
</script>

<template>
  <aside
    class="h-full overflow-hidden rounded-2xl border border-light-border bg-light-fill/70 dark:border-light-border-dark dark:bg-light-fill-dark/70 backdrop-blur"
  >
    <div class="h-full flex flex-col">
      <div class="border-b border-light-border p-4 dark:border-light-border-dark">
        <router-link :to="{ name: 'data' }">
          <el-button text>
            {{ t('Data.Metric.Back') }}
          </el-button>
        </router-link>
        <div class="mt-3">
          <div class="text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">
            {{ t('Data.Metric.SelectedType') }}
          </div>
          <div class="mt-1 text-xl font-semibold">
            {{ type }}
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4 space-y-6">
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-medium">{{ t('Data.Metric.Change') }} {{ type }}</span>
            <span class="text-xs text-light-2 dark:text-light-2">
              {{ nodeOrPodList.length }}
            </span>
          </div>
          <div class="max-h-48 overflow-auto rounded-xl border border-light-border dark:border-light-border-dark">
            <router-link
              v-for="item in nodeOrPodList"
              :key="item.name"
              class="flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-moonlight-500/10 hover:text-moonlight-500"
              :class="{
                'bg-moonlight-500/10 text-moonlight-500': item.name === currentTarget
              }"
              :to="item.getRoute(route)"
            >
              <span class="truncate">{{ item.name }}</span>
              <span
                v-if="item.name === currentTarget"
                class="ml-3 text-xs uppercase tracking-wide"
              >
                Now
              </span>
            </router-link>
          </div>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-medium">{{ t('Data.Metric.SelectMetricName') }}</span>
            <span class="text-xs text-light-2 dark:text-light-2">
              {{ selectedMetricName.size }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <router-link
              class="text-moonlight-500 hover:underline"
              :to="{ name: route.name, query: { ...route.query, metricName: addAllAll() } }"
            >
              {{ t('Data.Metric.AddAll') }}
            </router-link>
            <router-link
              class="text-danger hover:underline"
              :to="{ name: route.name, query: { ...route.query, metricName: '' } }"
            >
              {{ t('Data.Metric.RemoveAll') }}
            </router-link>
          </div>

          <div class="space-y-4">
            <section
              v-for="group in metricNameData"
              :key="group.name"
              class="rounded-xl border border-light-border dark:border-light-border-dark"
            >
              <div class="flex items-center justify-between px-3 py-3 border-b border-light-border dark:border-light-border-dark">
                <div>
                  <div class="text-sm font-semibold">
                    {{ group.name }}
                  </div>
                  <div class="text-xs text-light-2 dark:text-light-2">
                    {{ group.metricName.length }} metrics
                  </div>
                </div>
                <div class="flex items-center gap-3 text-sm">
                  <router-link
                    class="text-moonlight-500 hover:underline"
                    :to="{ name: route.name, query: {
                      ...route.query,
                      metricName: addAll(group.metricName, currentMetricName)
                    } }"
                  >
                    {{ t('Data.Metric.AddAll') }}
                  </router-link>
                  <router-link
                    class="text-danger hover:underline"
                    :to="{ name: route.name, query: {
                      ...route.query,
                      metricName: removeAll(group.metricName, currentMetricName)
                    } }"
                  >
                    {{ t('Data.Metric.RemoveAll') }}
                  </router-link>
                </div>
              </div>

              <div class="max-h-72 overflow-auto p-2">
                <router-link
                  v-for="metric in group.metricName"
                  :key="metric"
                  class="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-moonlight-500/10"
                  :class="selectedMetricName.has(metric)
                    ? 'bg-moonlight-500/10 text-moonlight-500'
                    : 'hover:text-moonlight-500'"
                  :to="{ name: route.name, query: {
                    ...route.query,
                    metricName: getMetricNameStr(metric, currentMetricName)
                  } }"
                >
                  <span class="pr-4 break-all">{{ metric }}</span>
                  <span class="shrink-0 text-xs uppercase tracking-wide">
                    {{ selectedMetricName.has(metric) ? t('Data.Metric.Remove') : t('Data.Metric.Add') }}
                  </span>
                </router-link>
              </div>
            </section>
          </div>
        </section>

        <section class="space-y-3">
          <span class="text-base font-medium">{{ t('Data.Metric.SelectTimeInterval') }}</span>
          <s2e
            :manager="machine"
            :query="true"
            size="default"
          />
        </section>
      </div>
    </div>
  </aside>
</template>
