<script setup lang="ts">
import { Madison } from '@/core/madison'

const service = Madison.getInstance().metrics.machine.pod.selectedService
const namespace = Madison.getInstance().namespace.queryNamespace

</script>

<template>
  <div
    v-if="service"
    style="top: calc(100% - 200px);"
    class="fixed right-28 w-64 overflow-auto max-h-48 bg-darker-fill/50 dark:bg-darker-fill-dark/50 rounded-md border border-darker-border dark:border-darker-border-dark backdrop-blur"
  >
    <div class="sticky top-0 bg-darker-fill dark:bg-darker-fill-dark p-2 text-lg border-b border-darker-border dark:border-darker-border-dark">
      {{ service.name }}
    </div>
    <div class="p-2 flex flex-col gap-2">
      <div
        v-for="ins in service.instances"
        :key="ins"
      >
        <router-link
          class="hover:text-moonlight-500 hover:underline"
          :to="{ name: 'displaymetricmachine', query: {
            namespace: namespace || 'unknown',
            pod: ins,
            type: 'pod'
          }}"
        >
          {{ ins }}
        </router-link>
      </div>
    </div>
  </div>
</template>
