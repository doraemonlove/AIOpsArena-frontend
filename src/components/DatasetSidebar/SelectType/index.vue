<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const type = computed(() => {
  if (typeof route.name === 'string') {
    if (route.matched.find((item) => item.name === 'metrics') !== undefined) {
      return 'Metrics'
    }
    return route.name[0].toLocaleUpperCase() + route.name.slice(1)
  }
  return 'unknown'
})
const types = ['logs', 'metrics', 'traces']
const namespace = Madison.getInstance().namespace.queryNamespace

</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-2xl hover:text-moonlight-500 hover:underline">
        <router-link :to="{ name: 'data' }">
          {{ t('Data.Sidebar.SelectType') }}
        </router-link>
      </span>
    </div>
    <div>
      <span class="text-gray-400">
        {{ t('Data.Sidebar.NowType') }}
      </span>
    </div>
    <div>
      <div class="text-center text-moonlight-500">{{ t('Data.Sidebar.' + type) }}</div>
    </div>
    <div>
      <span class="text-gray-400">
        {{ t('Data.Sidebar.YourTypes') }}
      </span>
    </div>
    <div
      v-for="ty, i in types"
      :key="i"
    >
      <router-link
        :to="{ name: ty, query: { namespace: route.query.namespace || 'unknown' } }"
        class="hover:text-moonlight-500 hover:underline"
      >
        {{ t('Data.Sidebar.' + ty[0].toLocaleUpperCase() + ty.slice(1)) }}
      </router-link>
    </div>
  </div>
</template>
