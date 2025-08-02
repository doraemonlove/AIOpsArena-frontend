<script setup lang="ts">
import { Madison } from '@/core/madison'
import LangIcon from './langIcon.vue'

const madison = Madison.getInstance()
const lang = madison.i18n.getLang()

function change() {
  madison.i18n.toggleLang()
}
</script>

<template>
  <div
    class="cursor-pointer"
    @click="change"
  >
    <LangIcon
      class="transition-all"
      :class="{ 'platform-header-lang-icon--en-us': lang === 'en-US'}"
    />
  </div>
</template>

<style>
.platform-header-lang-icon--en-us {
  transform: scaleX(-1);
}
</style>
