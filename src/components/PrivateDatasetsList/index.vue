<script setup lang="ts">
import { Madison } from '@/core/madison'
import type { DatasetIns } from '@/core/madison-addon-dataset-manager/core/dataset'
import { computed, ref, type ComputedRef, type Ref } from 'vue'

const madison = Madison.getInstance()
const dataset = madison.dataset
const list = dataset.privateDatasets
const namespaces = madison.namespace.namespaces

const loading = ref(false)

const dialogVisible = ref(false)
const timeRange: Ref<[Date, Date] | string> = ref('')
const name = ref('')
const description = ref('')
const log = ref(false)
const trace = ref(false)
const metric = ref(false)
const metricStep: Ref<number> = ref(1)
const namespace = ref('')
const options = namespaces.value.map((namespace) => {
  return {
    value: namespace,
    label: namespace
  }
})
const visible = ref(false)
const category = computed(() => {
  return `${log.value ? 'log,' : ''}${metric.value ? 'metric_' + metricStep.value.toString() + ',' : ''}${trace.value ? 'trace' : ''}}`
})
const confirmAvailable: ComputedRef<boolean> = computed(() => {
  return !!name.value && timeRange.value !== '' && !!namespace.value
})

function handleDetail(index: number, row: DatasetIns) {
  console.log(index, row)
}

async function handleVisible(index: number, row: DatasetIns) {
  // await dataset.updateDatasetVisible(row.id, ro ? 'True' : 'False')
}

async function handleDelete(index: number, row: DatasetIns) {
  loading.value = true
  await dataset.deleteDataset(row.id)
  loading.value = false
}

function handleCreate() {
  name.value = ''
  timeRange.value = ''
  description.value = ''
  visible.value = false
  log.value = false
  trace.value = false
  metric.value = false
  metricStep.value = 1
  namespace.value = ''
  dialogVisible.value = true
}

function disabledDate(date: Date) {
  return date.getTime() > Date.now()
}

async function createConfirm() {
  const tr = timeRange.value as [Date, Date]
  const options = {
    datasetName: name.value,
    description: description.value,
    category: category.value,
    namespace: namespace.value,
    visible: visible.value ? 'True' : 'False',
    startTime: tr[0].getTime().toString(),
    endTime: tr[1].getTime().toString()
  }
  await dataset.createDataset(options)
  dialogVisible.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4 pl-4 pr-4">
      <span class="text-xl">Private Datasets</span>
      <el-button
        type="primary"
        plain
        :disabled="loading"
        @click="handleCreate"
      >Create Dataset</el-button>
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
      <el-table-column
        prop="status"
        label="Status"
      />
      <el-table-column label="Operations">
        <template #default="scope">
          <div class="flex gap-4">
            <el-button
              size="small"
              plain
              :disabled="loading"
              @click="handleDetail(scope.$index, scope.row)"
            >Detail</el-button>
            <el-button
              size="small"
              plain
              type="primary"
              :disabled="loading"
              @click="handleVisible(scope.$index, scope.row)"
            >{{ scope.row.visible ? 'Visible' : 'invisible' }}</el-button>
            <el-button
              size="small"
              plain
              type="danger"
              :disabled="loading"
              @click="handleDelete(scope.$index, scope.row)"
            >Delete</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      v-model="dialogVisible"
      title="Create Dataset"
      width="500px"
    >
      <div class="flex flex-col gap-4">
        <span>Time Range</span>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="To"
          start-placeholder="Start date"
          end-placeholder="End date"
          :disabled-date="disabledDate"
          style="width: 100%;"
        />
        <span>Dataset Name</span>
        <el-input
          v-model="name"
          placeholder="Dataset Name"
        />
        <span>Description</span>
        <el-input
          v-model="description"
          placeholder="Description"
        />
        <span>Category</span>
        <div class="flex flex-col gap-2">
          <el-switch
            v-model="log"
            active-text="Log"
            inactive-text="No Log"
          />
          <div class="flex gap-4 items-center">
            <el-switch
              v-model="metric"
              active-text="Metric"
              inactive-text="No Metric"
            />
            <el-input-number
              v-model="metricStep"
              :min="1"
              :max="100"
              :disabled="!metric"
              size="small"
            />
            <span>Metric Step</span>
          </div>
          <el-switch
            v-model="trace"
            active-text="Trace"
            inactive-text="No Trace"
          />
        </div>
        <span>Namespace</span>
        <el-select
          v-model="namespace"
          placeholder="Select Namespace"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <span>Visible</span>
        <el-switch
          v-model="visible"
          active-text="Visible"
          inactive-text="Invisible"
        />
      </div>
      <template #footer>
        <div class="flex gap-4 justify-end">
          <el-button
            :disabled="loading"
            @click="dialogVisible = false"
          >Cancel</el-button>
          <el-button
            :disabled="!confirmAvailable || loading"
            type="primary"
            @click="createConfirm"
          >
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
