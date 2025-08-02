<script setup lang="ts">

</script>

<template>
  <div class="w-screen h-screen flex justify-center items-center flex-col gap-4">
    <router-view />
    <router-link
      class="hover:text-moonlight-500 hover:underline"
      :to="{ name: 'home'}"
    >To home</router-link>
  </div>
</template>
