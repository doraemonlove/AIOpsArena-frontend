<script setup lang="ts">
import { useMadison } from '@/core/madison'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const madison = useMadison()
const calendarFaultsManager = madison.faultManager.calendarFaultsManager
const renderDataLoaded = calendarFaultsManager.renderDataLoaded
const currentRenderDataLoaded = calendarFaultsManager.currentRenderDataLoaded
const datesToWaitForLoading = calendarFaultsManager.datesToWaitForLoading
const datesToWaitForLoadingError = calendarFaultsManager.datesToWaitForLoadingError
</script>

<template>
  <div class="flex items-center justify-center gap-4 flex-shrink-0">
    <div
      v-show="currentRenderDataLoaded"
      class="max-w-[240px]"
    >
      <el-alert
        :title="t('FaultInjection.AllFaultsAreLoaded')"
        type="success"
        show-icon
        :closable="false"
      />
    </div>
    <div
      v-show="datesToWaitForLoading"
      class="max-w-[240px] text-nowrap"
    >
      <el-alert
        :title="`${t('FaultInjection.LoadingDates')}: ${datesToWaitForLoading}`"
        type="warning"
        show-icon
        :closable="false"
      />
    </div>
    <div
      v-show="renderDataLoaded"
      class="max-w-[240px]"
    >
      <el-alert
        :title="t('FaultInjection.RenderingCompleted')"
        type="success"
        show-icon
        :closable="false"
      />
    </div>
    <div
      v-show="datesToWaitForLoadingError"
      class="max-w-[240px] text-nowrap"
    >
      <el-alert
        :title="`${t('FaultInjection.ErrorDates')}: ${datesToWaitForLoadingError}`"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

