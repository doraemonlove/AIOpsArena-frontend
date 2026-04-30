<script setup lang="ts">
import { Madison } from '@/core/madison'
import { useI18n } from 'vue-i18n'
import LangIcon from './langIcon.vue'

const madison = Madison.getInstance()
const lang = madison.i18n.getLang()
const { t } = useI18n()

function change() {
  madison.i18n.toggleLang()
}
</script>

<template>
  <el-tooltip
    effect="dark"
    :content="t('Nav.ToggleLanguage')"
    placement="bottom"
  >
    <div
      class="cursor-pointer"
      @click="change"
    >
      <LangIcon
        class="transition-all"
        :class="{ 'platform-header-lang-icon--en-us': lang === 'en-US'}"
      />
    </div>
  </el-tooltip>
</template>

<style>
.platform-header-lang-icon--en-us {
  transform: scaleX(-1);
}
</style>
