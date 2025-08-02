<script setup lang="ts">
import LoginIcon from './loginIcon.vue'
</script>

<template>
  <router-link
    :to="{ name: 'login'}"
    class="cursor-pointer"
    title="Sign in"
  >
    <LoginIcon />
  </router-link>
</template>
