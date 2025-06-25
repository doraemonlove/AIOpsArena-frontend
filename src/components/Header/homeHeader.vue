<script setup lang="ts">
import links from './links.vue'
import theme from './theme.vue'
import lang from './lang.vue'
</script>

<template>
  <div class="w-full h-16 flex items-center justify-center pr-6 pl-6 border-b dark:border-white/20">
    <div class="flex items-center justify-between w-full max-w-[1200px]">
      <div class="flex items-center gap-4">
        <links />
      </div>
      <div class="flex items-center gap-4">
        <lang />
        <lang />
        <theme />
      </div>
    </div>
  </div>
</template>
