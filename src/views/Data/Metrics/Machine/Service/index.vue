<script setup lang="ts">
import { Madison } from '@/core/madison'
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
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
        if (params.dataType === 'edge') return `${params.data.source} calls ${params.data.target}`
        const service = topologyList.value.find((item) => item.name === params.name)
        if (!service) return params.name
        return [
          `<strong>${service.name}</strong>`,
          `${service.instances.length} pods`,
          `${service.calls.length} downstream calls`
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
            Services
          </router-link>
          <span>/</span>
          <span class="rounded-full bg-moonlight-500/10 px-3 py-1 text-moonlight-500">
            {{ selectedService.name }}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
              Service Workspace
            </div>
            <div class="mt-2 text-3xl font-semibold">{{ selectedService.name }}</div>
            <div class="mt-2 text-sm text-light-2 dark:text-light-2">
              Inspect service-level request, latency, and dependency signals without keeping the topology list open.
            </div>
          </div>
          <div class="rounded-2xl bg-white/80 px-4 py-3 text-right dark:bg-black/10">
            <div class="text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">Pods</div>
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
                  Attached Pods
                </div>
                <div class="text-2xl font-semibold">Workloads Behind This Service</div>
              </div>
              <div class="text-sm text-light-2 dark:text-light-2">
                {{ selectedService.instances.length }} pods
              </div>
            </div>

            <div
              v-if="selectedService.instances.length > 0"
              class="flex flex-wrap gap-3"
            >
              <router-link
                v-for="pod in visiblePods"
                :key="pod"
                :to="{ name: 'metricsmachinepod', query: { ...route.query, namespace: namespace || 'unknown', pod, service: undefined } }"
                class="rounded-full border border-light-border bg-white/80 px-4 py-2 text-sm transition hover:border-moonlight-500 hover:text-moonlight-500 dark:border-light-border-dark dark:bg-black/10"
              >
                {{ pod }}
              </router-link>
              <div
                v-if="hiddenPodCount > 0"
                class="rounded-full border border-dashed border-light-border px-4 py-2 text-sm text-light-2 dark:border-light-border-dark dark:text-light-2"
              >
                +{{ hiddenPodCount }} more
              </div>
            </div>

            <div
              v-else
              class="flex min-h-[160px] items-center justify-center text-light-2 dark:text-light-2"
            >
              No pods found for this service
            </div>
          </div>

        </section>

        <MetricInspector
          title="Service Metrics"
          description="Select service metrics for this service."
          empty-hint="Choose a service card to start"
        />
      </div>

      <ChartsBoard empty-message="Add one or more service metrics to render charts for this selected service." />
    </template>

    <template v-else>
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div class="flex items-end justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
              Service
            </div>
            <div class="text-3xl font-semibold">Service Directory</div>
            <div class="mt-2 text-sm text-light-2 dark:text-light-2">
              Click a service node in the call graph to open its metrics workspace.
            </div>
          </div>
          <div class="text-sm text-light-2 dark:text-light-2">
            {{ topologyList.length }} services
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div
          v-if="topologyList.length > 0"
          class="rounded-2xl border border-light-border bg-white/70 p-4 dark:border-light-border-dark dark:bg-black/10"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div class="text-lg font-semibold">Service Call Graph</div>
              <div class="text-sm text-light-2 dark:text-light-2">
                Drag to arrange, scroll to zoom, click a node to inspect metrics.
              </div>
            </div>
            <div class="text-sm text-light-2 dark:text-light-2">
              {{ graphLinks.length }} calls
            </div>
          </div>
          <div
            ref="graph"
            class="w-full rounded-xl bg-light-fill/60 dark:bg-light-fill-dark/60"
            style="height: 620px;"
          />
        </div>

        <div
          v-else
          class="flex min-h-[280px] items-center justify-center text-lg text-light-2 dark:text-light-2"
        >
          It could be a namespace error or a server error
        </div>
      </section>
    </template>
  </div>
</template>
