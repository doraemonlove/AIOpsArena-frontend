<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Madison } from '@/core/madison'
import { useI18n } from 'vue-i18n'
import LogoutIcon from './logoutIcon.vue'

const router = useRouter()
const { t } = useI18n()

function logout() {
  const res = Madison.getInstance().login.logout()
  if (res) router.push({ name: 'login' })
}
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="t('Nav.SignOut')"
    placement="bottom"
  >
    <div
      class="cursor-pointer"
      @click="logout"
    >
      <LogoutIcon />
    </div>
  </el-tooltip>
</template>
