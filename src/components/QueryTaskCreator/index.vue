<script setup lang="ts" generic="DATA, MANAGER1 extends MadisonAddonDataTMR2T<DATA>, MANAGER2 extends MadisonAddonDataS2E<DATA>">
import type { MadisonAddonDataS2E, MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'
import s2e from './TimeRangePicker/s2e.vue'
import t2r from './TimeRangePicker/tmr2t.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<{
  manager: MANAGER1,
  type: 't2r',
  display?: 'block' | 'inline'
} | {
  manager: MANAGER2,
  type: 's2e',
  display?: 'block' | 'inline'
}>()

const type = props.type
const manager = props.manager
const display = props.display || 'inline'
const disabled = computed(() => {
  if (type === 's2e') {
    const tm = manager as MANAGER2
    return tm.displayStartTime.value.getTime() === 0 && tm.displayEndTime.value.getTime() === 0
  } else {
    const tm = manager as MANAGER1
    return typeof tm.timestamp.value === 'string' ? true : tm.timestamp.value.getTime() === 0
  }
})
const dialogVisible = ref(false)

const handleConfirm = () => {
  manager.createQueryTask()
  dialogVisible.value = false
}
</script>

<template>
  <div
    class="p-4 flex flex-col gap-4"
    :class="{ 'h-full': display === 'block' }"
  >
    <div
      v-if="display === 'inline'"
      class="flex justify-center"
    >
      <el-button
        class="w-full max-w-[600px]"
        type="primary"
        plain
        @click="dialogVisible = true"
      >{{ t('Data.QueryTaskList.CreateQueryTask') }}</el-button>
    </div>
    <div
      v-if="display === 'block'"
      class="h-full flex items-center justify-center"
    >
      <div
        class="flex flex-col items-center text-moonlight-500 p-4 cursor-pointer"
        @click="dialogVisible = true"
      >
        <el-icon :size="128"><DocumentAdd /></el-icon>
        <span class="text-2xl">{{ t('Data.QueryTaskList.CreateQueryTask') }}</span>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="t('Data.QueryTaskList.CreateQueryTask')"
      width="400"
      append-to-body
    >
      <s2e
        v-if="type === 's2e'"
        :manager="(manager as MANAGER2)"
      />
      <t2r
        v-if="type === 't2r'"
        :manager="(manager as MANAGER1)"
      />
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="dialogVisible = false">{{ t('Data.QueryTaskList.Cancel') }}</el-button>
          <el-button
            type="primary"
            :disabled="disabled"
            @click="handleConfirm"
          >
            {{ t('Data.QueryTaskList.Confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
