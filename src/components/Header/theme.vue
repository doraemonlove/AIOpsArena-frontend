<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useI18n } from 'vue-i18n'

const ins = Madison.getInstance().theme
const theme = Madison.getInstance().theme.theme
const { t } = useI18n()

function change() {
  ins.toggle()
}
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="t('Nav.ToggleTheme')"
    placement="bottom"
  >
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
  </el-tooltip>
</template>
