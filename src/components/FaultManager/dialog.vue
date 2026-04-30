<script setup lang="ts">
import { useMadison } from '@/core/madison'
import FaultDetail from './faultDetail.vue'
import { computed, ref, type WritableComputedRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from '@/utils/utils'

const { t } = useI18n()
const madison = useMadison()
const faultManager = madison.faultManager
const { selectedFaultName, selectedFaultIns } = faultManager

function clearSelectedFault(keepCategory = true) {
  if (!keepCategory || selectedFaultName.value.length === 0) {
    selectedFaultName.value = []
    return
  }
  selectedFaultName.value = [selectedFaultName.value[0]]
}

const dialogVisible: WritableComputedRef<boolean, boolean> = computed({
  get: () => selectedFaultIns.value !== null,
  set: (value) => {
    if (!value) clearSelectedFault(true)
  }
})

const loading = ref(false)
const schemaLoading = ref(false)

watch(
  () => selectedFaultIns.value,
  async (detail) => {
    if (!detail) return
    schemaLoading.value = true
    try {
      await faultManager.prepareFaultDetail(detail)
    } finally {
      schemaLoading.value = false
    }
  },
  { immediate: true }
)

async function confirm() {
  loading.value = true
  try {
    const res = await selectedFaultIns.value?.confirm()
    if (res && res[0]) {
      dialogVisible.value = false
    } else if (res) {
      message(res[1])
    }
  } finally {
    loading.value = false
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
      v-if="dialogVisible && !schemaLoading"
      :key="selectedFaultIns?.templateName || selectedFaultName.join('-')"
      :class="{ 'pointer-events-none': loading }"
    />
    <div
      v-else-if="schemaLoading"
      class="flex min-h-[240px] items-center justify-center"
    >
      <el-skeleton
        animated
        class="w-full"
        :rows="6"
      />
    </div>
    <template #footer>
      <span class="flex gap-4 justify-end">
        <el-button
          :disabled="loading || schemaLoading"
          @click="dialogVisible = false"
        >
          {{ t('FaultInjection.InjectionDialog.Cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading || schemaLoading"
          :disabled="schemaLoading"
          @click="confirm"
        >
          {{ t('FaultInjection.InjectionDialog.Confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
