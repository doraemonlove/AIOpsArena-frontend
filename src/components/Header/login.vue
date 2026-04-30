<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoginIcon from './loginIcon.vue'

const { t } = useI18n()
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="t('Nav.SignIn')"
    placement="bottom"
  >
    <router-link
      :to="{ name: 'login'}"
      class="cursor-pointer"
    >
      <LoginIcon />
    </router-link>
  </el-tooltip>
</template>
