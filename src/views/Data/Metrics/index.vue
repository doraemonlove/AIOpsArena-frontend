<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const madison = Madison.getInstance()
const namespace = madison.namespace.queryNamespace
const names = [{
  path: 'metricsmachine',
  name: 'Data.Metrics.Machine'
}]

</script>

<template>
  <div class="h-full box-border border-l border-light-border dark:border-light-border-dark">
    <div class="flex gap-4 pl-2 pr-2 h-10 box-border border-b border-light-border dark:border-light-border-dark">
      <router-link
        v-for="name in names"
        :key="name.path"
        :to="{ name: name.path, query: {namespace: namespace || 'unknown'}}"
        class="inline-flex items-center h-full box-border border-b-2 border-transparent hover:text-moonlight-500 transition-all"
        :class="{ '!border-moonlight-500': route.matched.find((item) => item.name === name.path) !== undefined }"
      >
        <span>{{ t(name.name) }}</span>
      </router-link>
    </div>
    <div style="height: calc(100% - 40px);">
      <router-view />
    </div>
  </div>
</template>
