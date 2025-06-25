<script setup lang="ts">
import { Topology } from '@/core/madison-addon-metrics/core/machine/node/topology'
import { Madison } from '@/core/madison'

const props = defineProps({
  node: {
    type: Topology,
    required: true
  }
})
const node = props.node
const namespace = Madison.getInstance().namespace.paramNamespace
</script>

<template>
  <div class="box-border border border-light-border dark:border-light-border-dark rounded flex flex-col justify-between">
    <div
      v-if="node.instances.length > 0"
      class="p-4"
    >
      <div
        v-for="ins in node.instances"
        :key="ins"
      >
        <span>
          {{ ins }}
        </span>
      </div>
    </div>
    <div
      v-if="node.instances.length === 0"
      class="flex justify-center items-center size-full p-4"
    >
      <span>No instances</span>
    </div>
    <router-link
      :to="{ name: 'displaymetricmachine', query: {
        namespace: namespace || 'unknown',
        node: node.name,
        type: 'node'
      }}"
      class="p-2 text-center border-t border-light-border dark:border-light-border-dark hover:text-moonlight-500"
    >
      <span class="text-lg ">
        {{ node.name }}
      </span>
    </router-link>
  </div>

</template>
