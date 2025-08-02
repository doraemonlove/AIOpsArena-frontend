<script setup lang="ts" generic="DATA, MANAGER1 extends MadisonAddonDataTMR2T<DATA>, MANAGER2 extends MadisonAddonDataS2E<DATA>">
import { MadisonAddonDataS2E, MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'
import QueryTaskCreator from '@/components/QueryTaskCreator/index.vue'
import item from './item.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<{
  manager: MANAGER1,
  type: 't2r',
  nonCreate?: boolean
} | {
  manager: MANAGER2,
  type: 's2e',
  nonCreate?: boolean
} | {
  manager: any,
  type: 'etc',
  nonCreate: true
}>()
const manager = props.manager
const type = props.type
const nonCreate = props.nonCreate
const data: {
  manager: MANAGER1,
  type: 't2r'
} | {
  manager: MANAGER2,
  type: 's2e'
} = {
  manager,
  type
}  as {
  manager: MANAGER1,
  type: 't2r'
} | {
  manager: MANAGER2,
  type: 's2e'
}
</script>

<template>
  <div class="p-4 pt-0 h-full w-64 flex flex-col gap-4 sticky top-0 overflow-auto">
    <div class="sticky top-0 bg-bg dark:bg-bg-dark z-10 pt-4">
      <div>
        <span class="text-2xl">{{ t('Data.QueryTaskList.QueryTaskList') }}</span>
      </div>
      <QueryTaskCreator
        v-if="!nonCreate"
        v-bind="data"
      />
    </div>
    <div
      v-if="manager.queryTaskList.value.length === 0"
      class="h-full flex justify-center items-center"
    >
      <span>
        {{ t('Data.QueryTaskList.NullQueryTask') }}
      </span>
    </div>
    <div
      v-else
      class="flex gap-2 flex-col"
    >
      <item
        v-for="t in manager.queryTaskList.value"
        :key="t.id"
        :task="t"
        :manager="manager"
      />
    </div>
  </div>
</template>
