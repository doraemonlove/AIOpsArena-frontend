<script setup lang="ts">
import { useMadison } from '@/core/madison'
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
        title="All faults are loaded"
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
        :title="`Loading dates: ${datesToWaitForLoading}`"
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
        title="Rendering completed"
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
        :title="`Error dates: ${datesToWaitForLoadingError}`"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

