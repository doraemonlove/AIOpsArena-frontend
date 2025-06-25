<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
</script>

<template>
  <Structure>
    <template #main>
      <div class="w-full overflow-x-hidden relative">
        <router-view />
      </div>
    </template>
  </Structure>
</template>
