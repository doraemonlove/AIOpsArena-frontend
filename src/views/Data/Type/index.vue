<script setup lang="ts">
import card from './card.vue'
</script>

<template>
  <div class="w-full h-full flex items-center justify-center flex-wrap gap-4">
    <card type="logs" />
    <card type="metrics" />
    <card type="traces" />
  </div>
</template>
