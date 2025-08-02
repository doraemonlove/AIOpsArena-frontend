<script setup lang="ts">
import { Madison } from '@/core/madison'
import node from './node.vue'

const topology = Madison.getInstance().metrics.machine.node.topology
</script>

<template>
  <div class="h-full overflow-auto p-6 box-border relative">
    <div
      v-show="topology.length > 0"
      class="flex flex-wrap gap-6"
    >
      <node
        v-for="item in topology"
        :key="item.id"
        :node="item"
      />
    </div>
    <div
      v-show="topology.length === 0"
      class="absolute top-0 left-0 size-full flex justify-center items-center flex-col gap-2"
    >
      <span class="text-red-500 text-4xl">
        Display ERROR
      </span>
      <span class="text-lg">
        It could be a namespace error or a server error
      </span>
    </div>
  </div>
</template>
