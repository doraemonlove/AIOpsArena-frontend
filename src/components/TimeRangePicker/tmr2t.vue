<script setup lang="ts" generic="DATA, MANAGER extends MadisonAddonDataTMR2T<DATA>">
import { MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'

const props = defineProps<{
  manager: MANAGER,
  size?: 'large' | 'default' | 'small',
  query?: boolean
}>()
const manager = props.manager
const size = props.size || 'default'
const query = props.query === true

const timestamp = manager.timestamp
const hasPrevStep = manager.hasPrevStep
const hasNextStep = manager.hasNextStep
const rangeStr = manager.rangeStr
const rangeIndex = manager.rangeIndex
const disable = manager.isCreatingQueryTask

function change() {
  manager.createQueryTask()
}
function disabledDate(date: Date) {
  return date.getTime() > Date.now()
}
</script>

<template>
  <div class="flex items-center gap-4">
    <div class="flex items-center">
      <el-button
        :size="size"
        type="primary"
        style="border-top-right-radius: 0px; border-bottom-right-radius: 0px;"
        :disabled="disable || !hasPrevStep"
        @click="rangeIndex--"
      >
        <el-icon>
          <ArrowLeft />
        </el-icon>
      </el-button>
      <el-input
        v-model="rangeStr"
        :size="size"
        class="el-input--no-rounded"
        input-style="text-align: center; width: 40px; display: inline-block;"
        :disabled="disable"
        @change="change"
      />
      <el-button
        :size="size"
        type="primary"
        style="border-top-left-radius: 0px; border-bottom-left-radius: 0px;"
        :disabled="disable || !hasNextStep"
        @click="rangeIndex++"
      >
        <el-icon>
          <ArrowRight />
        </el-icon>
      </el-button>
    </div>
    <el-date-picker
      v-model="timestamp"
      :size="size"
      type="datetime"
      placeholder="Select end time point"
      :disabled="disable"
      :disabled-date="disabledDate"
    />
    <el-button
      v-if="query"
      :size="size"
      :disabled="disable"
      :loading="disable"
      @click="manager.createQueryTask()"
    >
      Search
    </el-button>
  </div>
</template>
