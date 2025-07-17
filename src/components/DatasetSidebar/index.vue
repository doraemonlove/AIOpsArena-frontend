<script setup lang="ts">
import SelectNamespace from './SelectNamespace/index.vue'
import SelectType from './SelectType/index.vue'
</script>

<template>
  <div class="w-64 flex flex-col gap-4 sticky top-0 p-4">
    <SelectNamespace />
    <SelectType />
  </div>
</template>
