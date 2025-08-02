<script setup lang="ts">
import { useMadison } from '@/core/madison'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const madison = useMadison()
const trace = madison.trace
const searchId = ref('')

const handleSearch = () => {
  if (searchId.value === '') return
  trace.searchId.value = searchId.value
  trace.createQueryTask()
  searchId.value = ''
}
</script>

<template>
  <div class="flex gap-4 max-w-[1000px] mx-auto w-full items-center">
    <router-link :to="{ name: 'data' }">
      <el-button :icon="ArrowLeft">
        {{ t('Data.Trace.Back') }}
      </el-button>
    </router-link>
    <span class="text-nowrap">
      {{ t('Data.Trace.SearchPrompt') }}
    </span>
    <el-input v-model="searchId" />
    <el-button
      :disabled="searchId === ''"
      plain
      type="primary"
      @click="handleSearch"
    >
      {{ t('Data.Trace.Search') }}
    </el-button>
  </div>
</template>
