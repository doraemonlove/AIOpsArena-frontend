<script setup lang="ts" generic="DATA, MANAGER extends MadisonAddonDataS2E<DATA>">
import type { MadisonAddonDataS2E } from '@/core/madison/core/addon-base'
import { useI18n } from 'vue-i18n'
const props = defineProps<{
  manager: MANAGER,
  size?: 'large' | 'default' | 'small',
  query?: boolean
}>()

const { t } = useI18n()
const manager = props.manager
const size = props.size || 'default'
const query = props.query === true

const timeRange = manager.timeRange
const disable = manager.isCreatingQueryTask

function disabledDate(date: Date) {
  return date.getTime() > Date.now()
}

const shortcuts = [
  {
    text: 'Last day',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: 'Last week',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: 'Last month',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  }
]
</script>

<template>
  <div class="flex items-center gap-4">
    <el-date-picker
      v-model="timeRange"
      :size="size"
      type="datetimerange"
      range-separator="To"
      start-placeholder="Start date"
      end-placeholder="End date"
      :disabled-date="disabledDate"
      :shortcuts="shortcuts"
    />
    <el-button
      v-if="query"
      :disabled="disable"
      :loading="disable"
      :size="size"
      @click="manager.createQueryTask()"
    >
      Search
    </el-button>
  </div>
</template>
