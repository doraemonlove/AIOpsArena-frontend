<script setup lang="ts">
import { Madison } from '@/core/madison'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const namespaces = Madison.getInstance().namespace.namespaces
const inputNamespace = ref('')
</script>

<template>
  <div class="flex flex-col gap-4 p-4 w-full items-center">
    <div>
      <span class="text-3xl">{{ t('Data.Namespace.SelectOrInputNamespace') }}</span>
    </div>
    <div class="flex gap-2">
      <div class="w-60">
        <el-input
          v-model="inputNamespace"
          :placeholder="t('Data.Sidebar.InputNamespace')"
        />
      </div>
      <el-button :disabled="inputNamespace === ''">
        <router-link
          :class="{'pointer-events-none': inputNamespace === ''}"
          :to="{ name: 'datatype', query: { namespace: inputNamespace || 'unknown' }}"
        >
          {{ t('Data.Sidebar.Goto') }}
        </router-link>
      </el-button>
    </div>
    <div class="flex gap-2 flex-col items-center">
      <div>
        <span class="text-2xl">{{ t('Data.Sidebar.YourNamespaces') }}</span>
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
