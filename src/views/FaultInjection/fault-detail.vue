<script setup lang="ts">
import { ScheduleRenderData } from '@/components/LoongCalendar'
import { useMadison } from '@/core/madison'
import { message } from '@/utils/utils'
import { computed, ref } from 'vue'
import { JsonViewer } from 'vue3-json-viewer'

const props = defineProps({
  fault: {
    type: ScheduleRenderData,
    required: true
  }
})

const madison = useMadison()
const theme = madison.theme.theme
const faultManager = madison.faultManager

const faultRD = props.fault
const faultS = faultRD.schedule
const faultD = faultS.meta
const jsonData = faultD.meta
const timestamp = (faultD.timestamp as number) * 1000
const dialogVisible = ref(false)
const disabled = new Date(timestamp) <= new Date()
console.log('disabled', disabled)

async function handleDelete() {
  if (new Date(timestamp) <= new Date()) {
    message('请勿删除正在执行的故障')
    return
  }
  const res = await faultManager.deleteFault(faultD.id)
  if (res) {
    message('Delete fault success', 'success')
    dialogVisible.value = false
  } else {
    message('Delete fault failed')
  }
}
</script>

<template>
  <div>
    <div class="w-full flex flex-col gap-4">
      <div>
        name: {{ faultD.name }}
      </div>
      <div>
        timestamp: {{ new Date(timestamp).toLocaleString() }}
      </div>
      <div>
        duration: {{ faultD.duration }}s
      </div>
      <div>
        <el-button
          plain
          type="danger"
          :disabled="disabled"
          @click="dialogVisible = true"
        >
          Delete
        </el-button>
      </div>
      <div>
        <JsonViewer
          :value="jsonData"
          copyable
          sort
          :theme="theme"
          expanded
          :expand-depth="1000"
          :preview-mode="false"
        />
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      title="Warning"
      width="600"
    >

      <span class="text-lg">Are you sure you want to <el-text type="danger">DELETE</el-text> fault {{ faultD.name }}</span>
      <template #footer>
        <div class="flex gap-4 justify-end">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button
            type="danger"
            :disabled="disabled"
            @click="handleDelete"
          >
            DELETE
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
