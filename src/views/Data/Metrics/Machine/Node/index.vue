<script setup lang="ts">
import { Madison } from '@/core/madison'
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
const topology = Madison.getInstance().metrics.machine.node.topology
const namespace = Madison.getInstance().namespace.queryNamespace
const topologyList = computed(() => topology.value || [])
const selectedNodeName = computed(() => (route.query.node as string) || '')
const selectedNode = computed(
  () => topologyList.value.find((item) => item.name === selectedNodeName.value) || null
)
const visiblePods = computed(() => selectedNode.value?.instances.slice(0, 8) || [])
const hiddenPodCount = computed(() => {
  if (!selectedNode.value) return 0
  return Math.max(selectedNode.value.instances.length - visiblePods.value.length, 0)
})
</script>

<template>
  <div class="min-h-full px-8 py-8">
    <template v-if="selectedNode">
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/40 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/40">
        <div class="flex flex-wrap items-center gap-2 text-sm text-light-2 dark:text-light-2">
          <router-link
            :to="{ name: route.name, query: { ...route.query, namespace: namespace || 'unknown', node: undefined, metricName: route.query.metricName, endTime: route.query.endTime, range: route.query.range, startTime: undefined } }"
            class="rounded-full bg-white/80 px-3 py-1 transition hover:text-moonlight-500 dark:bg-black/10"
          >
            {{ t('Data.MetricsMachine.Node.Plural') }}
          </router-link>
          <span>/</span>
          <span class="rounded-full bg-moonlight-500/10 px-3 py-1 text-moonlight-500">
            {{ selectedNode.name }}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="text-3xl font-semibold">{{ selectedNode.name }}</div>
            <div class="mt-3 text-sm text-light-2 dark:text-light-2">
              {{ t('Data.MetricsMachine.Node.WorkspaceDescription') }}
            </div>
          </div>
          <div class="rounded-2xl bg-white/80 px-4 py-3 text-right dark:bg-black/10">
            <div class="text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">{{ t('Data.MetricsMachine.Node.PodsOnNode') }}</div>
            <div class="mt-2 text-2xl font-semibold">{{ selectedNode.instances.length }}</div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section class="rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
                {{ t('Data.MetricsMachine.Node.AttachedPods') }}
              </div>
              <div class="text-2xl font-semibold">{{ t('Data.MetricsMachine.Node.WorkloadsRunningHere') }}</div>
            </div>
            <div class="text-sm text-light-2 dark:text-light-2">
              {{ t('Data.MetricsMachine.Node.PodsCount', { count: selectedNode.instances.length }) }}
            </div>
          </div>

          <div
            v-if="selectedNode.instances.length > 0"
            class="flex flex-wrap gap-4"
          >
            <div
              v-for="pod in visiblePods"
              :key="pod"
              class="rounded-full border border-light-border bg-white/80 px-5 py-3 text-sm leading-5 dark:border-light-border-dark dark:bg-black/10"
            >
              <span class="break-all">
                {{ pod }}
              </span>
            </div>
            <div
              v-if="hiddenPodCount > 0"
              class="rounded-full border border-dashed border-light-border px-5 py-3 text-sm text-light-2 dark:border-light-border-dark dark:text-light-2"
            >
              {{ t('Data.MetricsMachine.Common.MoreCount', { count: hiddenPodCount }) }}
            </div>
          </div>

          <div
            v-else
            class="flex min-h-[180px] items-center justify-center text-light-2 dark:text-light-2"
          >
            {{ t('Data.MetricsMachine.Node.NoPodsOnNode') }}
          </div>
        </section>

        <MetricInspector
          :title="t('Data.MetricsMachine.Node.MetricsTitle')"
          :description="t('Data.MetricsMachine.Node.MetricsDescription')"
          :empty-hint="t('Data.MetricsMachine.Node.ChooseNodeHint')"
        />
      </div>

      <ChartsBoard :empty-message="t('Data.MetricsMachine.Node.EmptyChartMessage')" />
    </template>

    <template v-else>
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div class="flex items-end justify-between gap-4">
          <div>
            <div class="text-3xl font-semibold">{{ t('Data.MetricsMachine.Node.DirectoryTitle') }}</div>
            <div class="mt-3 text-sm text-light-2 dark:text-light-2">
              {{ t('Data.MetricsMachine.Node.DirectoryDescription') }}
            </div>
          </div>
          <div class="text-sm text-light-2 dark:text-light-2">
            {{ t('Data.MetricsMachine.Node.NodesCount', { count: topologyList.length }) }}
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div
          v-if="topologyList.length > 0"
          class="grid gap-4"
          style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));"
        >
          <router-link
            v-for="item in topologyList"
            :key="item.id"
            :to="{ name: route.name, query: { ...route.query, namespace: namespace || 'unknown', node: item.name } }"
            class="group flex min-h-[148px] flex-col justify-between rounded-2xl border border-light-border bg-white/80 p-4 transition-all hover:-translate-y-1 hover:border-moonlight-500 hover:shadow-lg dark:border-light-border-dark dark:bg-black/10"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-lg font-semibold">{{ item.name }}</div>
                <div class="mt-1 text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">
                  {{ t('Data.MetricsMachine.Node.ComputeNode') }}
                </div>
              </div>
              <div
                class="inline-flex min-h-[32px] min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium leading-none"
                :class="item.instances.length > 0
                  ? 'bg-moonlight-500/10 text-moonlight-500'
                  : 'bg-light-fill text-light-2 dark:bg-light-fill-dark dark:text-light-2'"
              >
                {{ item.instances.length > 0
                  ? t('Data.MetricsMachine.Node.PodsCount', { count: item.instances.length })
                  : t('Data.MetricsMachine.Common.NoPods') }}
              </div>
            </div>

            <div class="mt-4 space-y-2 text-sm">
              <div
                v-if="item.instances.length === 0"
                class="rounded-lg bg-light-fill px-3 py-2 text-light-2 dark:bg-light-fill-dark dark:text-light-2"
              >
                {{ t('Data.MetricsMachine.Common.NoPodsScheduled') }}
              </div>
              <template v-else>
                <div
                  v-for="ins in item.instances.slice(0, 3)"
                  :key="ins"
                  class="truncate rounded-lg bg-light-fill px-3 py-2 dark:bg-light-fill-dark"
                >
                  {{ ins }}
                </div>
                <div
                  v-if="item.instances.length > 3"
                  class="text-xs uppercase tracking-[0.16em] text-light-2 dark:text-light-2"
                >
                  {{ t('Data.MetricsMachine.Common.MorePodsCount', { count: item.instances.length - 3 }) }}
                </div>
              </template>
            </div>

            <div class="mt-4">
              <span class="inline-flex items-center justify-center rounded-full bg-moonlight-500 px-4 py-2 text-sm font-medium text-white transition-all group-hover:bg-moonlight-600">
                {{ t('Data.MetricsMachine.Common.OpenWorkspace') }}
              </span>
            </div>
          </router-link>
        </div>

        <div
          v-else
          class="flex min-h-[280px] items-center justify-center text-lg text-light-2 dark:text-light-2"
        >
          {{ t('Data.MetricsMachine.Common.NamespaceOrServerError') }}
        </div>
      </section>
    </template>
  </div>
</template>
