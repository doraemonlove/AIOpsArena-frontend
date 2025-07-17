<script setup lang="ts">
import { useMadison } from '@/core/madison'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ref } from 'vue'

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
        返回
      </el-button>
    </router-link>
    <span class="text-nowrap">输入需要检索的Trace ID</span>
    <el-input v-model="searchId" />
    <el-button
      :disabled="searchId === ''"
      plain
      type="primary"
      @click="handleSearch"
    >
      Search
    </el-button>
  </div>
</template>
