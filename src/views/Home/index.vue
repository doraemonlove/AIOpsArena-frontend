<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
import Welcome from '@/components/Welcome/index.vue'
</script>

<template>
  <Structure>
    <template #main>
      <Welcome />
    </template>
  </Structure>
</template>

<style>
.test {
    --size: 40px;
    background: linear-gradient(90deg, rgba(255, 255, 255, .1) 1px, transparent 1px), linear-gradient(rgba(255, 255, 255, .1) 1px, transparent 1px);
    background-size: var(--size) var(--size);
}
</style>
