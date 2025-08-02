<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Madison } from '@/core/madison'
import LogoutIcon from './logoutIcon.vue'

const router = useRouter()

function logout() {
  const res = Madison.getInstance().login.logout()
  if (res) router.push({ name: 'login' })
}
</script>

<template>
  <div
    class="cursor-pointer"
    title="Sign out"
    @click="logout"
  >
    <LogoutIcon />
  </div>
</template>
