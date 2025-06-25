<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
import PrivateDatasetsList from '@/components/PrivateDatasetsList/index.vue'
import PublicDatasetsList from '@/components/PublicDatasetsList/index.vue'
</script>

<template>
  <Structure>
    <template #main>
      <div class="flex flex-col gap-4">
        <PublicDatasetsList />
        <PrivateDatasetsList />
      </div>
    </template>
  </Structure>
</template>
