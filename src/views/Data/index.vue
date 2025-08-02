<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
import DatasetSidebar from '@/components/DatasetSidebar/index.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useMadison } from '@/core/madison'
import MyHome from './Home/index.vue'
const route = useRoute()
const madison = useMadison()
const namespacesAmount = computed(() => madison.namespace.namespaces.value.length)
const namespace = route.query.namespace as string
const check = madison.namespace.namespaces.value.indexOf(namespace) !== -1

const home = computed(() => route.name === 'data')
const sidebar = computed(() => route.matched.find(
  (item) =>
    item.name === 'logs' ||
    item.name === 'traces' ||
    item.name === 'metrics'
) !== undefined)
const hFull = computed(() => route.matched.find((item) => item.name === 'metrics') === undefined)

const showSelector = computed(() => namespacesAmount.value > 0 || route.query.namespace !== undefined)
</script>

<template>
  <Structure main-full>
    <template #main>
      <MyHome v-if="home" />
      <div
        v-if="!home"
        class="relative w-full h-full overflow-auto flex max-w-1500 mx-auto gap-4 justify-between"
      >
        <DatasetSidebar v-if="sidebar" />
        <div
          class="w-full h-full"
          :class="{'platform-dataset-root': sidebar}"
        >
          <router-view />
        </div>
      </div>
    </template>
  </Structure>
</template>

<style>
.platform-dataset-root {
  width: calc(100% - 280px);
}
</style>
