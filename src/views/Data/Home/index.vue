<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useRoute, useRouter, type RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import card from './card.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const namespace = Madison.getInstance().namespace
const namespaces = namespace.namespaces
const showSelector = computed(() => namespaces.value.length > 0 || route.query.namespace !== undefined)

const inputNamespace = ref('')

onBeforeUnmount(() => {
  // watchHandle.stop()
})

const cards: {
    title: string,
    disc: string,
    to: string,
    icon: string,
    needNamespace?: boolean
  }[] = [
    {
      title: 'Logs',
      disc: 'Data.Home.Logs',
      to: 'logs',
      icon: 'Logs'
    },
    {
      title: 'Metrics',
      disc: 'Data.Home.Metrics',
      to: 'metrics',
      icon: 'Metrics'
    },
    {
      title: 'Traces',
      disc: 'Data.Home.Traces',
      to: 'traces',
      icon: 'Traces'
    }
  // {
  //   title: 'Metric',
  //   disc: 'Metric',
  //   to: 'metric',
  //   icon: 'Metric'
  // },
  // {
  //   title: 'Trace',
  //   disc: 'Trace',
  //   to: 'tracesearch',
  //   icon: 'Trace',
  //   needNamespace: false
  // }
  ]
</script>

<template>
  <div class="relative w-full h-full flex max-w-1500 mx-auto gap-4 justify-between">
    <div class="flex flex-col gap-2 p-4 overflow-auto w-64">
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
    <div
      v-if="showSelector"
      style="width: calc(100% - 280px);"
      class="overflow-auto flex flex-wrap justify-center"
    >
      <card
        v-for="c in cards"
        :key="c.to"
        :title="c.title"
        :to="c.to"
        :disc="t(c.disc)"
        :icon="c.icon"
        :need-namespace="c.needNamespace !== undefined ? c.needNamespace : true"
      />
    </div>
    <div
      v-else
      style="width: calc(100% - 280px);"
      class="overflow-auto flex justify-center items-center flex-col gap-4"
    >
      <p class="text-3xl text-red-500">{{ t('Data.Home.NullNamespace') }}</p>
      <p class="text-xl">
        {{ t('Data.Home.PLSGoto') }}
        <router-link
          class="text-moonlight-500"
          to="microservice"
        >
          {{ t('Data.Home.Microservice') }}
        </router-link>
        {{ t('Data.Home.Or') }}
        <router-link
          class="text-moonlight-500"
          to="testbed"
        >
          {{ t('Data.Home.Testbed') }}
        </router-link>
        {{ t('Data.Home.LastS') }}
      </p>
      <p class="text-xl">
        {{ t('Data.Home.OINS') }}
        <el-input
          v-model="inputNamespace"
          :placeholder="t('Data.Home.InputNamespace')"
          style="width: 180px;"
          class="mr-2"
        />
        <el-button
          :disabled="inputNamespace === ''"
          @click="inputNamespace = ''"
        >
          <router-link
            :class="{'pointer-events-none': inputNamespace === ''}"
            :to="{ name: route.name, query: { namespace: inputNamespace || 'unknown' }}"
          >
            {{ t('Data.Home.Goto') }}
          </router-link>
        </el-button></p>
    </div>
  </div>
</template>
