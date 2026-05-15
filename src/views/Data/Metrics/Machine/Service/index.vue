<script setup lang="ts">
import { Madison } from '@/core/madison'
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const topology = madison.metrics.machine.pod.topology
const topologyList = computed(() => topology.value || [])
const graph = ref<HTMLDivElement | null>(null)
let graphChart: echarts.ECharts | null = null
const selectedServiceName = computed(() => (route.query.service as string) || '')
const selectedService = computed(
  () => topologyList.value.find((item) => item.name === selectedServiceName.value) || null
)
const visiblePods = computed(() => selectedService.value?.instances.slice(0, 8) || [])
const hiddenPodCount = computed(() => {
  if (!selectedService.value) return 0
  return Math.max(selectedService.value.instances.length - visiblePods.value.length, 0)
})

const graphNodes = computed(() => {
  return topologyList.value.map((item) => ({
    id: item.name,
    name: item.name,
    value: item.instances.length,
    symbolSize: Math.max(48, Math.min(88, 48 + item.instances.length * 8)),
    itemStyle: {
      color: '#409eff'
    },
    label: {
      show: true
    }
  }))
})

const graphLinks = computed(() => {
  return topologyList.value.flatMap((item) =>
    item.calls.map((call) => ({
      source: item.name,
      target: call
    }))
  )
})

async function waitForGraphReady(maxRetries = 20) {
  await nextTick()
  for (let i = 0; i < maxRetries; i++) {
    const element = graph.value
    if (element && element.clientWidth > 0 && element.clientHeight > 0) return element
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  return graph.value
}

async function renderServiceGraph() {
  const element = await waitForGraphReady()
  if (!element || element.clientWidth === 0 || element.clientHeight === 0) return

  if (graphChart && graphChart.getDom() !== element) {
    graphChart.dispose()
    graphChart = null
  }

  if (!graphChart) {
    graphChart = echarts.init(element, madison.theme.theme.value === 'light' ? undefined : 'dark')
    graphChart.on('click', (params) => {
      if (params.dataType !== 'node' || typeof params.name !== 'string') return
      madison.routerPromise.router.push({
        name: route.name,
        query: {
          ...route.query,
          namespace: namespace.value || 'unknown',
          service: params.name
        }
      })
    })
  }

  graphChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'edge') return t('Data.MetricsMachine.Service.GraphCallEdge', { source: params.data.source, target: params.data.target })
        const service = topologyList.value.find((item) => item.name === params.name)
        if (!service) return params.name
        return [
          `<strong>${service.name}</strong>`,
          t('Data.MetricsMachine.Service.PodsCount', { count: service.instances.length }),
          t('Data.MetricsMachine.Service.DownstreamCallsCount', { count: service.calls.length })
        ].join('<br/>')
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: graphNodes.value,
        links: graphLinks.value,
        left: 80,
        right: 80,
        top: 70,
        bottom: 90,
        force: {
          repulsion: 1100,
          edgeLength: [150, 280],
          gravity: 0.04
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 12],
        label: {
          show: true,
          fontSize: 13,
          formatter: '{b}'
        },
        lineStyle: {
          color: '#94a3b8',
          curveness: 0.18,
          opacity: 0.75,
          width: 2
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
            opacity: 1
          }
        }
      }
    ]
  } satisfies echarts.EChartsOption, true)
  graphChart.resize()
  window.setTimeout(() => {
    graphChart?.dispatchAction({
      type: 'graphRoam',
      zoom: 0.96,
      originX: element.clientWidth / 2,
      originY: element.clientHeight / 2
    })
    graphChart?.resize()
  }, 600)
}

function resizeServiceGraph() {
  graphChart?.resize()
}

function disposeServiceGraph() {
  window.removeEventListener('resize', resizeServiceGraph)
  graphChart?.dispose()
  graphChart = null
}

onMounted(() => {
  renderServiceGraph()
  window.addEventListener('resize', resizeServiceGraph)
})

watch(
  () => graph.value,
  (element) => {
    if (element) renderServiceGraph()
  }
)

watch(
  () => selectedServiceName.value,
  (service) => {
    if (service) {
      graphChart?.dispose()
      graphChart = null
      return
    }
    renderServiceGraph()
  }
)

watch(
  () => [topologyList.value, madison.theme.theme.value],
  () => {
    if (graphChart) {
      graphChart.dispose()
      graphChart = null
    }
    renderServiceGraph()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  disposeServiceGraph()
})
</script>

<template>
  <div class="min-h-full px-8 py-8">
    <template v-if="selectedService">
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/40 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/40">
        <div class="flex flex-wrap items-center gap-2 text-sm text-light-2 dark:text-light-2">
          <router-link
            :to="{ name: route.name, query: { ...route.query, namespace: namespace || 'unknown', service: undefined, metricName: route.query.metricName, endTime: route.query.endTime, range: route.query.range, startTime: undefined } }"
            class="rounded-full bg-white/80 px-3 py-1 transition hover:text-moonlight-500 dark:bg-black/10"
          >
            {{ t('Data.MetricsMachine.Service.Plural') }}
          </router-link>
          <span>/</span>
          <span class="rounded-full bg-moonlight-500/10 px-3 py-1 text-moonlight-500">
            {{ selectedService.name }}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="text-3xl font-semibold">{{ selectedService.name }}</div>
            <div class="mt-3 text-sm text-light-2 dark:text-light-2">
              {{ t('Data.MetricsMachine.Service.WorkspaceDescription') }}
            </div>
          </div>
          <div class="rounded-2xl bg-white/80 px-4 py-3 text-right dark:bg-black/10">
            <div class="text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">{{ t('Data.MetricsMachine.Common.Pods') }}</div>
            <div class="mt-2 text-2xl font-semibold">{{ selectedService.instances.length }}</div>
          </div>
        </div>
      </div>

      <div class="grid gap-6">
        <section>
          <div class="rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
            <div class="mb-4 flex items-center justify-between">
              <div>
              <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
                  {{ t('Data.MetricsMachine.Service.AttachedPods') }}
              </div>
                <div class="text-2xl font-semibold">{{ t('Data.MetricsMachine.Service.WorkloadsBehindService') }}</div>
              </div>
              <div class="text-sm text-light-2 dark:text-light-2">
                {{ t('Data.MetricsMachine.Service.PodsCount', { count: selectedService.instances.length }) }}
              </div>
            </div>

            <div
              v-if="selectedService.instances.length > 0"
              class="flex flex-wrap gap-4"
            >
              <router-link
                v-for="pod in visiblePods"
                :key="pod"
                :to="{ name: 'metricsmachinepod', query: { ...route.query, namespace: namespace || 'unknown', pod, service: undefined } }"
                class="rounded-full border border-light-border bg-white/80 px-5 py-3 text-sm leading-5 transition hover:border-moonlight-500 hover:text-moonlight-500 dark:border-light-border-dark dark:bg-black/10"
              >
                <span class="break-all">
                  {{ pod }}
                </span>
              </router-link>
              <div
                v-if="hiddenPodCount > 0"
                class="rounded-full border border-dashed border-light-border px-5 py-3 text-sm text-light-2 dark:border-light-border-dark dark:text-light-2"
              >
                {{ t('Data.MetricsMachine.Common.MoreCount', { count: hiddenPodCount }) }}
              </div>
            </div>

            <div
              v-else
              class="flex min-h-[160px] items-center justify-center text-light-2 dark:text-light-2"
            >
              {{ t('Data.MetricsMachine.Service.NoPodsForService') }}
            </div>
          </div>

        </section>

        <MetricInspector
          :title="t('Data.MetricsMachine.Service.MetricsTitle')"
          :description="t('Data.MetricsMachine.Service.MetricsDescription')"
          :empty-hint="t('Data.MetricsMachine.Service.ChooseServiceHint')"
        />
      </div>

      <ChartsBoard :empty-message="t('Data.MetricsMachine.Service.EmptyChartMessage')" />
    </template>

    <template v-else>
      <div class="mb-8 rounded-2xl border border-light-border bg-light-fill/50 p-7 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div class="flex min-h-[132px] items-end justify-between gap-6">
          <div>
            <div class="text-3xl font-semibold">{{ t('Data.MetricsMachine.Service.DirectoryTitle') }}</div>
            <div class="mt-3 max-w-3xl text-sm leading-6 text-light-2 dark:text-light-2">
              {{ t('Data.MetricsMachine.Service.DirectoryDescription') }}
            </div>
          </div>
          <div class="self-start rounded-xl bg-white/70 px-4 py-3 text-sm text-light-2 shadow-sm dark:bg-black/10 dark:text-light-2">
            {{ t('Data.MetricsMachine.Service.ServicesCount', { count: topologyList.length }) }}
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-light-border bg-light-fill/50 p-7 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div
          v-if="topologyList.length > 0"
          class="rounded-2xl border border-light-border bg-white/70 p-6 dark:border-light-border-dark dark:bg-black/10"
        >
          <div class="mb-5 flex min-h-[92px] flex-wrap items-center justify-between gap-4 px-1">
            <div>
              <div class="text-lg font-semibold">{{ t('Data.MetricsMachine.Service.CallGraphTitle') }}</div>
              <div class="mt-2 text-sm leading-6 text-light-2 dark:text-light-2">
                {{ t('Data.MetricsMachine.Service.CallGraphDescription') }}
              </div>
            </div>
            <div class="rounded-xl bg-light-fill/80 px-4 py-3 text-sm text-light-2 dark:bg-light-fill-dark/80 dark:text-light-2">
              {{ t('Data.MetricsMachine.Service.CallsCount', { count: graphLinks.length }) }}
            </div>
          </div>
          <div
            ref="graph"
            class="w-full rounded-xl bg-light-fill/60 dark:bg-light-fill-dark/60"
            style="height: 700px;"
          />
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
