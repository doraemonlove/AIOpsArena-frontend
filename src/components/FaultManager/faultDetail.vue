<script setup lang="ts">
import { useMadison } from '@/core/madison'
const madison = useMadison()
const faultManager = madison.faultManager
const { selectedFaultIns } = faultManager

const FaultDetailCom = selectedFaultIns.value?.getFaultInjectComponent()
</script>

<template>
  <FaultDetailCom />
</template>
