<script setup lang="ts" generic="DATA, MANAGER extends MadisonAddonDataBase<DATA>">
import { MadisonDataQueryTaskStatus } from '@/core/madison'
import type { MadisonAddonDataBase, MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const props = defineProps<{
  task: MadisonAddonDataQueryTask<DATA>,
    manager: MANAGER
}>()
const task = props.task
const manager = props.manager
const route = useRoute()
const select = computed<boolean>(() => task.check(route))
const statusColor = computed<string>(() => {
  switch (task.status) {
    case MadisonDataQueryTaskStatus.READY: return '#909399'
    case MadisonDataQueryTaskStatus.LOADING: return '#E6A23C'
    case MadisonDataQueryTaskStatus.SUCCESS: return '#67C23A'
    case MadisonDataQueryTaskStatus.ERROR: return '#F56C6C'
  }
  return '#909399'
})

const handleRemove = (e: MouseEvent) => {
  e.preventDefault()
  manager.removeTask(task.id)
}
</script>

<template>
  <router-link
    :to="task.path"
    class="border dark:border-white/20 rounded p-2 text-sm hover:shadow transition-all cursor-pointer flex w-full flex-col gap-2 relative overflow-hidden"
  >
    <div
      v-if="select"
      class="absolute w-1 bg-moonlight-500 top-0 left-0 h-full pointer-events-none"
    />
    <div class="flex justify-between items-center">
      <span>Status: <span :style="{ color: statusColor }">{{ task.status }}</span></span>
      <span
        class="hover:text-moonlight-500"
        @click.stop="handleRemove"
      ><el-icon><Close /></el-icon></span>
    </div>
    <div v-html="task.showMsg" />
  </router-link>
</template>
