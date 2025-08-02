<script setup lang="ts">
import { useMadison } from '@/core/madison'
import FaultDetail from './faultDetail.vue'
import { computed, ref, type WritableComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from '@/utils/utils'

const { t } = useI18n()
const madison = useMadison()
const faultManager = madison.faultManager
const { selectedFaultName, selectedFaultIns } = faultManager
const dialogVisible: WritableComputedRef<boolean, boolean> = computed({
  get: () => selectedFaultIns.value !== null,
  set: (value) => {
    if (!value) selectedFaultName.value = []
  }
})

const loading = ref(false)

async function confirm() {
  const res = await selectedFaultIns.value?.confirm()
  if (res && res[0]) {
    dialogVisible.value = false
  } else if (res) {
    message(res[1])
  }
}

function beforeClose(done: any) {
  if (!loading.value) done()
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('FaultInjection.InjectionDialog.Injection')"
    width="800px"
    :open-delay="300"
    :before-close="beforeClose"
  >
    <FaultDetail
      v-if="dialogVisible"
      :key="Date.now()"
      :class="{ 'pointer-events-none': loading }"
    />
    <template #footer>
      <span class="flex gap-4 justify-end">
        <el-button
          :disabled="loading"
          @click="dialogVisible = false"
        >
          {{ t('FaultInjection.InjectionDialog.Cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="confirm"
        >
          {{ t('FaultInjection.InjectionDialog.Confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
