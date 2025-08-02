<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const namespace = Madison.getInstance().namespace
const namespaces = namespace.namespaces

const inputNamespace = ref('')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-2xl hover:text-moonlight-500 hover:underline">
        <router-link :to="{ name: 'data' }">
          {{ t('Data.Sidebar.SelectData') }}
        </router-link>
      </span>
    </div>
    <div>
      <span class=" text-gray-400">{{ t('Data.Sidebar.NowNamespace') }}</span>
    </div>
    <div>
      <div class=" text-center text-moonlight-500">{{ namespace.queryNamespace }}</div>
    </div>
    <div>
      <span class=" text-gray-400">{{ t('Data.Sidebar.InputNamespace') }}</span>
    </div>
    <div class="flex gap-2 items-center">
      <div>
        <el-input
          v-model="inputNamespace"
          size="small"
          :placeholder="t('Data.Sidebar.InputNamespace')"
        />
      </div>
      <el-button
        size="small"
        :disabled="inputNamespace === ''"
        @click="inputNamespace = ''"
      >
        <router-link
          :class="{'pointer-events-none': inputNamespace === ''}"
          :to="{ name: route.name, query: { namespace: inputNamespace || 'unknown' }}"
        >
          {{ t('Data.Sidebar.Goto') }}
        </router-link>
      </el-button>
    </div>
    <div>
      <span class=" text-gray-400">{{ t('Data.Sidebar.YourNamespaces') }}</span>
    </div>
    <div
      v-for="n, i in namespaces"
      :key="i"
    >
      <router-link
        class="hover:text-moonlight-500 hover:underline"
        :to="{ name: route.name, query: { ...route.query, namespace: n || 'unknown' } }"
      >
        {{ n }}
      </router-link>
    </div>
  </div>
</template>
