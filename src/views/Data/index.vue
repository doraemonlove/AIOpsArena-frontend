<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
import DatasetSidebar from '@/components/DatasetSidebar/index.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
const route = useRoute()

const sidebar = computed(() => route.matched.find((item) => item.name === 'datanamespace') !== undefined)
const hFull = computed(() => route.matched.find((item) => item.name === 'metrics') === undefined)
</script>

<template>
  <Structure main-full>
    <template #main>
      <div class="relative w-full h-full overflow-auto flex max-w-1500 mx-auto gap-4 justify-between">
        <DatasetSidebar />
        <div
          class="w-full"
          :class="{'platform-dataset-root': sidebar, 'h-full': hFull}"
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
