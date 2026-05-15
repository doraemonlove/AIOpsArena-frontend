<script setup lang="ts">
import { useRoute } from 'vue-router'
import { MadisonDataQueryTaskStatus, useMadison } from '@/core/madison'
import TraceDetail from '@/components/TraceDetail/index.vue'
import type { TraceDetail as TraceDetailMadison } from '@/core/madison-addon-trace/core/trace'
import search from './search.vue'
import QueryTaskList from '@/components/QueryTaskList/index.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const id = route.params.id as string
const { t } = useI18n()
const madison = useMadison()
const trace = madison.trace
const detail = trace.data
const error = detail === null
const isSearchPage = computed(() => route.name === 'tracesearch')

</script>

<template>
  <div class="flex gap-4 justify-between h-full relative overflow-auto">
    <div
      style="width: calc(100% - 280px);"
      class="flex flex-col pt-4"
      :class="{ 'justify-center items-center': isSearchPage }"
    >
      <search />
      <TraceDetail
        v-if="detail !== null && detail.data !== null && detail.data.children.length > 0"
        :id="id"
        :detail="detail.data"
      />
      <div
        v-show="detail !== null"
        class="w-full flex justify-center items-center h-96"
      >
        <span
          v-show="detail?.status === MadisonDataQueryTaskStatus.LOADING || detail?.status === MadisonDataQueryTaskStatus.READY"
          class="text-moonlight-500 text-9xl"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
        </span>
        <span
          v-show="detail?.status === MadisonDataQueryTaskStatus.SUCCESS && detail?.data !== null && detail?.data.children.length === 0"
          class="text-moonlight-500 text-2xl"
        >{{ t('Data.Trace.NoData') }}</span>
        <span
          v-show="detail?.status === MadisonDataQueryTaskStatus.ERROR"
          class="text-red-500 text-2xl"
        >{{ t('Data.Common.Error') }}</span>
      </div>
    </div>
    <QueryTaskList
      :manager="trace"
      type="etc"
      :non-create="true"
    />
  </div>
</template>
