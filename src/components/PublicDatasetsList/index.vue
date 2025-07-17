<script setup lang="ts">
import { Madison } from '@/core/madison'
import type { DatasetIns } from '@/core/madison-addon-dataset/core/dataset'

const madison = Madison.getInstance()
const dataset = madison.dataset
const list = dataset.publicDatasets

function handleDetail (index: number, row: DatasetIns) {
  console.log(index, row)
}

</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4 pl-4 pr-4">
      <span class="text-xl">Public Datasets</span>
    </div>
    <el-table
      :data="list"
      style="width: 100%"
    >
      <el-table-column
        prop="name"
        label="Name"
        width="180"
      />
      <el-table-column
        prop="description"
        label="Description"
      />
      <el-table-column
        prop="microserive"
        label="Microserive"
      />
      <el-table-column label="Operations">
        <template #default="scope">
          <el-button
            size="small"
            plain
            @click="handleDetail(scope.$index, scope.row)"
          >Detail</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
