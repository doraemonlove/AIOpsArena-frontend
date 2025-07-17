<script setup lang="ts">
import { useMadison } from '@/core/madison'
import MyDialog from './dialog.vue'
const madison = useMadison()
const faultManager = madison.faultManager
const { selectedFaultName, selectedFaultIns, cascaderOptions } = faultManager
const { namespacesSelected, namespacesSelectedOptions } = faultManager.calendarFaultsManager

</script>

<template>
  <div class="flex items-center justify-center gap-4 flex-shrink-0">
    <div class="flex gap-2 items-center">
      <span>Namespace:</span>
      <el-select
        v-model="namespacesSelected"
        placeholder="Select"
        style="width: 200px;"
      >
        <el-option
          v-for="item in namespacesSelectedOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div>
      <el-cascader
        v-model="selectedFaultName"
        placeholder="选择需要注入的故障"
        :options="cascaderOptions"
        :show-all-levels="false"
        style="width: 180px;"
      />
    </div>
    <MyDialog />
  </div>
</template>
