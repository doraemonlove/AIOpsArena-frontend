<script setup lang="ts">
import LoginIcon from './loginIcon.vue'
</script>

<template>
  <router-link
    :to="{ name: 'login'}"
    class="cursor-pointer"
    title="Login"
  >
    <LoginIcon />
  </router-link>
</template>
