<script setup lang="ts">
import { Madison } from '@/core/madison'

const ins = Madison.getInstance().theme
const theme = Madison.getInstance().theme.theme

function change() {
  ins.toggle()
}
</script>

<template>
  <span
    class="flex items-center cursor-pointer"
    @click="change"
  >
    <el-icon
      v-show="theme === 'light'"
      size="24"
    ><Sunny /></el-icon>
    <el-icon
      v-show="theme === 'dark'"
      size="24"
    ><Moon /></el-icon>
  </span>
</template>
