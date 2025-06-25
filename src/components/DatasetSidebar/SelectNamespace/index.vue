<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
const route = useRoute()
const namespace = Madison.getInstance().namespace
const namespaces = namespace.namespaces

const inputNamespace = ref('')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-2xl hover:text-moonlight-500 hover:underline">
        <router-link :to="{ name: 'data'}">
          Select Namespace
        </router-link>
      </span>
    </div>
    <div>
      <span class=" text-gray-400">Now Namespace:</span>
    </div>
    <div>
      <div class=" text-center text-moonlight-500">{{ namespace.paramNamespace }}</div>
    </div>
    <div>
      <span class=" text-gray-400">Input Namespace</span>
    </div>
    <div class="flex gap-2 items-center">
      <div>
        <el-input
          v-model="inputNamespace"
          size="small"
          placeholder="Input Namespace"
        />
      </div>
      <el-button
        size="small"
        :disabled="inputNamespace === ''"
      >
        <router-link
          :class="{'pointer-events-none': inputNamespace === ''}"
          :to="{ name: route.name, params: { namespace: inputNamespace || 'unknown' }}"
        >
          Goto
        </router-link>
      </el-button>
    </div>
    <div>
      <span class=" text-gray-400">Your Namespaces</span>
    </div>
    <div
      v-for="n, i in namespaces"
      :key="i"
    >
      <router-link
        class="hover:text-moonlight-500 hover:underline"
        :to="{ name: route.name, params: { ...route.params, namespace: n || 'unknown' }, query: route.query }"
      >
        {{ n }}
      </router-link>
    </div>
  </div>
</template>
