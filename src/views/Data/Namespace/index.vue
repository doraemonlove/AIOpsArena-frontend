<script setup lang="ts">
import { Madison } from '@/core/madison'
import { ref } from 'vue'
const namespaces = Madison.getInstance().namespace.namespaces
const inputNamespace = ref('')

console.log(namespaces.value)
</script>

<template>
  <div class="flex flex-col gap-4 p-4 w-full items-center">
    <div>
      <span class="text-3xl">Select Or Input Namespace</span>
    </div>
    <div class="flex gap-2">
      <div class="w-60">
        <el-input v-model="inputNamespace" />
      </div>
      <el-button :disabled="inputNamespace === ''">
        <router-link
          :class="{'pointer-events-none': inputNamespace === ''}"
          :to="{ name: 'datatype', query: { namespace: inputNamespace || 'unknown' }}"
        >
          Goto
        </router-link>
      </el-button>
    </div>
    <div class="flex gap-2 flex-col items-center">
      <div>
        <span class="text-2xl">Your Namespaces</span>
      </div>
      <div
        v-for="n, i in namespaces"
        :key="i"
        class="hover:text-moonlight-500 hover:underline text-xl"
      >
        <router-link :to="{ name: 'datatype', query: { namespace: n || 'unknown' } }">
          {{ n }}
        </router-link>
      </div>
    </div>
  </div>
</template>
