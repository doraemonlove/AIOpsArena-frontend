<script setup lang="ts">
import links from './links.vue'
import theme from './theme.vue'
import lang from './lang.vue'
import logout from './logout.vue'
import login from './login.vue'
import github from './github.vue'

import { Madison } from '@/core/madison'
const logged = Madison.getInstance().login.logged
</script>

<template>
  <div class="w-full h-16 flex items-center justify-center pr-6 pl-6 border-b dark:border-white/20 backdrop-blur-lg bg-bg/30 dark:bg-bg-dark/30">
    <div class="flex items-center justify-between w-full max-w-[1200px] h-full">
      <div class="flex items-center gap-4 h-full">
        <links />
      </div>
      <div class="flex items-center gap-4 select-none">
        <lang />
        <theme />
        <github />
        <logout v-if="logged" />
        <login v-else />
      </div>
    </div>
  </div>
</template>
