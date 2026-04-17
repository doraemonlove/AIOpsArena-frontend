<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EvaluationStatus, RunStatus } from '@/core/madison-addon-algorithm-manager'

const props = withDefaults(defineProps<{
  status: RunStatus | EvaluationStatus | null | undefined
  kind?: 'run' | 'evaluation'
}>(), {
  kind: 'run'
})

const { t } = useI18n()

const type = computed(() => {
  const status = props.status || ''
  if (props.kind === 'evaluation') {
    if (status === 'success') return 'success'
    if (status === 'failed') return 'danger'
    if (status === 'skipped') return 'info'
    return 'warning'
  }
  if (status === 'finished') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'canceled') return 'info'
  return 'warning'
})

const text = computed(() => {
  const status = props.status || '--'
  const key =
    props.kind === 'evaluation'
      ? `TestRuns.EvaluationStatus.${status}`
      : `TestRuns.StatusText.${status}`
  const translated = t(key)
  return translated === key ? status : translated
})
</script>

<template>
  <el-tag :type="type">
    {{ text }}
  </el-tag>
</template>
