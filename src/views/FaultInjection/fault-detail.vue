<script setup lang="ts">
import { ScheduleRenderData } from '@/components/LoongCalendar'
import { useMadison } from '@/core/madison'
import { message } from '@/utils/utils'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { JsonViewer } from 'vue3-json-viewer'

const props = defineProps({
  fault: {
    type: ScheduleRenderData,
    required: true
  }
})

const emits = defineEmits(['close'])

const { t } = useI18n()
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

async function handleDelete() {
  if (new Date(timestamp) <= new Date()) {
    message(t('FaultInjection.DetailDialog.Ongoing'))
    return
  }
  const res = await faultManager.deleteFault(faultD.id)
  if (res) {
    dialogVisible.value = false
    emits('close')
  }
}
</script>

<template>
  <div>
    <div class="w-full flex flex-col gap-4">
      <div>
        {{ t('FaultInjection.DetailDialog.Name') }}: {{ faultD.name }}
      </div>
      <div>
        {{ t('FaultInjection.DetailDialog.Timestamp') }}: {{ new Date(timestamp).toLocaleString() }}
      </div>
      <div>
        {{ t('FaultInjection.DetailDialog.Duration') }}: {{ faultD.duration }}s
      </div>
      <div>
        <el-button
          plain
          type="danger"
          :disabled="disabled"
          @click="dialogVisible = true"
        >
          {{ t('FaultInjection.DetailDialog.Delete') }}
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
      :title="t('FaultInjection.DetailDialog.Warning')"
      width="600"
    >

      <span
        class="text-lg"
        v-html="t('FaultInjection.DetailDialog.DeletePrompt') + ' ' + faultD.name + ' ' + t('FaultInjection.DetailDialog.Q')"
      />
      <template #footer>
        <div class="flex gap-4 justify-end">
          <el-button @click="dialogVisible = false">
            {{ t('FaultInjection.DetailDialog.Cancel') }}
          </el-button>
          <el-button
            type="danger"
            :disabled="disabled"
            @click="handleDelete"
          >
            {{ t('FaultInjection.DetailDialog.Delete') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
