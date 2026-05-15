<script setup lang="ts">
import { Madison } from '@/core/madison'
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const topology = madison.metrics.machine.pod.topology
const topologyList = computed(() => topology.value || [])
const podEntries = computed(() => {
  return topologyList.value.flatMap((service) =>
    service.instances.map((pod) => ({
      name: pod,
      service: service.name,
      downstreamCalls: service.calls
    }))
  )
})
const selectedPodName = computed(() => (route.query.pod as string) || '')
const selectedPod = computed(
  () => podEntries.value.find((item) => item.name === selectedPodName.value) || null
)
</script>

<template>
  <div class="min-h-full px-8 py-8">
    <template v-if="selectedPod">
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/40 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/40">
        <div class="flex flex-wrap items-center gap-2 text-sm text-light-2 dark:text-light-2">
          <router-link
            :to="{ name: route.name, query: { ...route.query, namespace: namespace || 'unknown', pod: undefined, metricName: route.query.metricName, endTime: route.query.endTime, range: route.query.range, startTime: undefined } }"
            class="rounded-full bg-white/80 px-3 py-1 transition hover:text-moonlight-500 dark:bg-black/10"
          >
            Pods
          </router-link>
          <span>/</span>
          <span class="rounded-full bg-moonlight-500/10 px-3 py-1 text-moonlight-500">
            {{ selectedPod.name }}
          </span>
        </div>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
              Pod Workspace
            </div>
            <div class="mt-2 text-3xl font-semibold">{{ selectedPod.name }}</div>
            <div class="mt-2 text-sm text-light-2 dark:text-light-2">
              Inspect pod-level CPU, memory, filesystem, and network signals for this workload instance.
            </div>
          </div>
          <router-link
            :to="{ name: 'metricsmachineservice', query: { ...route.query, namespace: namespace || 'unknown', service: selectedPod.service, pod: undefined } }"
            class="rounded-2xl bg-white/80 px-4 py-3 text-right transition hover:text-moonlight-500 dark:bg-black/10"
          >
            <div class="text-xs uppercase tracking-[0.2em] text-light-2 dark:text-light-2">Service</div>
            <div class="mt-2 text-lg font-semibold">{{ selectedPod.service }}</div>
          </router-link>
        </div>
      </div>

      <div class="grid gap-6">
        <MetricInspector
          title="Pod Metrics"
          description="Select pod metrics for this workload instance."
          empty-hint="Choose a pod card to start"
        />
      </div>

      <ChartsBoard empty-message="Add one or more pod metrics to render charts for this selected pod." />
    </template>

    <template v-else>
      <div class="mb-6 rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div class="flex items-end justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.24em] text-light-2 dark:text-light-2">
              Pod
            </div>
            <div class="text-3xl font-semibold">Pod Directory</div>
            <div class="mt-2 text-sm text-light-2 dark:text-light-2">
              Pick a pod from its service group to open the metrics workspace.
            </div>
          </div>
          <div class="text-sm text-light-2 dark:text-light-2">
            {{ topologyList.length }} services · {{ podEntries.length }} pods
          </div>
        </div>
      </div>

      <section class="rounded-2xl border border-light-border bg-light-fill/50 p-5 dark:border-light-border-dark dark:bg-light-fill-dark/50">
        <div
          v-if="topologyList.length > 0"
          class="grid gap-4"
          style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));"
        >
          <section
            v-for="service in topologyList"
            :key="service.name"
            class="flex h-[280px] flex-col rounded-2xl border border-light-border bg-white/80 p-4 transition-all hover:border-moonlight-500 hover:shadow-lg dark:border-light-border-dark dark:bg-black/10"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-lg font-semibold">{{ service.name }}</div>
              </div>
              <div
                class="inline-flex min-h-[32px] min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium leading-none"
                :class="service.instances.length > 0
                  ? 'bg-moonlight-500/10 text-moonlight-500'
                  : 'bg-light-fill text-light-2 dark:bg-light-fill-dark dark:text-light-2'"
              >
                {{ service.instances.length }} pods
              </div>
            </div>

            <div class="mt-4 min-h-0 flex-1 overflow-auto rounded-xl bg-light-fill/70 p-2 dark:bg-light-fill-dark/70">
              <div
                v-if="service.instances.length === 0"
                class="flex h-full items-center justify-center text-sm text-light-2 dark:text-light-2"
              >
                No pods scheduled
              </div>
              <div
                v-else
                class="space-y-2"
              >
                <router-link
                  v-for="pod in service.instances"
                  :key="pod"
                  :to="{ name: route.name, query: { ...route.query, namespace: namespace || 'unknown', pod } }"
                  class="block truncate rounded-lg bg-white/80 px-3 py-2 text-sm transition hover:bg-moonlight-500/10 hover:text-moonlight-500 dark:bg-black/10"
                >
                  {{ pod }}
                </router-link>
              </div>
            </div>
          </section>
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
