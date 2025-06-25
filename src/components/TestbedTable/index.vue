<script setup lang="ts">
import { Madison } from '@/core/madison'
import { LoadItemStatus } from '@/core/madison-addon-load'
import type { Testbed } from '@/core/madison-addon-testbed/core/testbed'
import { message } from '@/utils/utils'
import { computed, reactive, ref } from 'vue'

type CreateParamsData = {
  k: number,
  key: string,
  value: string | number,
  type: string,
  component: string,
  writeable: boolean
}

const madison = Madison.getInstance()

const tableData = madison.testbed.testbeds
const loadButtonDisable = ref(false)
const loadDialogVisible = ref(false)
const createParams = reactive<CreateParamsData[]>([])
const createLoadOptions = computed(() => {
  const options: Record<string, string | number> = {}
  createParams.forEach((param) => {
    options[param.key] = param.value
  })
  return options
})
let createLoadTestbed: Testbed | null = null

async function loadButtonClick(index: number) {
  loadButtonDisable.value = true
  const testbed = tableData.value[index] as Testbed
  const namespace = testbed.namespace
  if (testbed.loadIns.status === LoadItemStatus.RUNNING) {
    await madison.load.deleteLoad(testbed.loadIns.id, namespace, testbed as Testbed)
    loadButtonDisable.value = false
  } else if (!testbed.loaded) {
    if (!madison.load.has(testbed.microserviceTypeId)) {
      message('Search load params')
    }
    const params = await madison.load.getLoadParams(testbed.microserviceTypeId)
    if (params === undefined) {
      message('No load params')
      loadDialogVisible.value = false
      return
    }
    createParams.length = 0
    createParams.push({
      k: Math.floor(Math.random() * 1000000),
      key: 'namespace',
      value: namespace,
      type: 'string',
      component: 'el-input',
      writeable: false
    })
    createParams.push({
      k: Math.floor(Math.random() * 1000000),
      key: 'testbed_id',
      value: testbed.id,
      type: 'string',
      component: 'el-input',
      writeable: false
    })
    params.keys.forEach((key) => {
      const v = params.get(key)
      const t = typeof v
      const c = t === 'string' ? 'el-input' : 'el-input-number'
      createParams.push({
        k: Math.floor(Math.random() * 1000000),
        key: key,
        value: v,
        type: t,
        component: c,
        writeable: true
      })
    })
    createLoadTestbed = testbed as Testbed
    loadDialogVisible.value = true
  }
}

async function createLoad() {
  if (createLoadTestbed === null) {
    message('Please select a testbed')
    return
  }
  await madison.load.createLoad(createLoadOptions.value, createLoadTestbed)
  loadButtonDisable.value = false
  loadDialogVisible.value = false
}

async function deleteTestbed(index: number) {
  loadButtonDisable.value = true
  const testbed = tableData.value[index] as Testbed
  const res = await madison.testbed.deleteTestbed(testbed.id)
  if (!res) message('Failed to delete testbed')
  loadButtonDisable.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4 pt-4">
    <div class="flex justify-between items-center pl-4 pr-4">
      <el-button
        size="small"
        plain
        :disabled="!madison.testbed.canCreate"
      >
        <router-link :to="{ name: 'microservice'}">增加</router-link>
      </el-button>
      <div class="select-none">
        <el-tooltip
          effect="dark"
          content="已使用"
          placement="top"
        >
          <span>{{ madison.testbed.usedTestbeds }}</span>
        </el-tooltip>
        /
        <el-tooltip
          effect="dark"
          content="上限"
          placement="top"
        >
          <span>{{ madison.testbed.maxTestbeds }}</span>
        </el-tooltip>
      </div>
    </div>
    <el-table
      :data="tableData"
      style="width: 100%"
    >
      <el-table-column
        prop="name"
        label="Name"
        width="180"
      />
      <el-table-column
        prop="microservice"
        label="Microservice"
      />
      <el-table-column
        prop="description"
        label="Description"
      />
      <el-table-column
        prop="localeCreatedTime"
        label="Time"
      />
      <el-table-column
        label="Status"
      >
        <template #default="scope">
          <span>{{ scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="Load Status"
      >
        <template #default="scope">
          <div class="flex gap-2">
            <span>{{ scope.row.loadIns.status }}</span>
            <span v-if="scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT">{{ scope.row.loadIns.deleteStatus === null ? `Load: ${scope.row.loadIns.installStatus}` : `Delete: ${scope.row.loadIns.deleteStatus}` }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Operations">
        <template #default="scope">
          <div class="flex gap-2">
            <el-button
              :type="scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT ? 'danger' : 'default'"
              :disabled="(scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus) !== 'SUCCESS' ||(scope.row.loadIns.status !== LoadItemStatus.RUNNING && scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT) || loadButtonDisable"
              size="small"
              plain
              @click="loadButtonClick(scope.$index)"
            >
              {{ scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT ? 'Stop' : 'Load' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="(scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus) !== 'SUCCESS'"
              :loading="scope.row.loadingDisplay"
              @click="deleteTestbed(scope.$index)"
            >
              Delete
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      v-model="loadDialogVisible"
      title="Create load"
      width="240"
      :closed="loadButtonDisable = false"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="param in createParams"
          :key="param.k"
          class="flex flex-col gap-1"
        >
          <span>{{ param.key }}</span>
          <component
            :is="param.component"
            v-model="param.value"
            :disabled="!param.writeable"
            :min="1"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <el-button
            size="small"
            @click="loadDialogVisible = false; loadButtonDisable = false"
          >Cancel</el-button>
          <el-button
            size="small"
            type="primary"
            @click="createLoad"
          >
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
