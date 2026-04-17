<script setup lang="ts">
import MyHeader from '@/components/Header/index.vue'
import bg from './bg.vue'

defineProps({
  noHeader: {
    type: Boolean,
    default: false
  },
  noFooter: {
    type: Boolean,
    default: false
  },
  mainFull: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="relative">
    <bg class="select-none -z-10" />
    <header
      v-if="!noHeader"
      class="sticky top-0 z-header"
    >
      <slot name="header">
        <MyHeader />
      </slot>
    </header>
    <main
      class="relative"
      :class="{'platform-structure-main--full': mainFull}"
    >
      <slot name="main" />
    </main>
    <footer v-if="!noFooter">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style>
.platform-structure-main--full {
  width: 100%;
  height: calc(100vh - 64px);
}
</style>
