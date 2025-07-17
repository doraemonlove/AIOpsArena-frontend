<script setup lang="ts">
import QueryTaskCreator from '@/components/QueryTaskCreator/index.vue'
import QueryTaskList from '@/components/QueryTaskList/index.vue'
import LogsList from '@/components/LogsList/index.vue'
import { useMadison } from '@/core/madison'
const madison = useMadison()
const logs = madison.logs
const log = logs.data
</script>

<template>
  <div class="flex gap-4 justify-between h-full relative overflow-auto">
    <div style="width: calc(100% - 280px);">
      <QueryTaskCreator
        v-show="log === null"
        :manager="logs"
        type="t2r"
        display="block"
      />
      <LogsList v-show="log !== null" />
    </div>
    <QueryTaskList
      :manager="logs"
      type="t2r"
    />
  </div>
</template>
