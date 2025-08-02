<script setup lang="ts">
import { Madison } from '@/core/madison'
import { LoadItemStatus } from '@/core/madison-addon-load'
import type { Testbed } from '@/core/madison-addon-testbed/core/testbed'
import { message } from '@/utils/utils'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type CreateParamsData = {
  k: number,
  key: string,
  value: string | number,
  type: string,
  component: string,
  writeable: boolean
}

const { t } = useI18n()

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
  } else if (testbed.loadIns.status === LoadItemStatus.NONEXISTENT) {
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

const tagType: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
  'PENDING': 'warning',
  'NONEXISTENT': 'info',
  'RUNNING': 'success',
  'DELETING': 'warning',
  'FAILURE': 'danger',
  'SUCCESS': 'success'
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
        <router-link :to="{ name: 'microservice'}">{{ t('Testbed.Add') }}</router-link>
      </el-button>
      <div class="select-none">
        <el-tooltip
          effect="dark"
          :content="t('Testbed.Usage')"
          placement="top"
        >
          <span>{{ madison.testbed.usedTestbeds }}</span>
        </el-tooltip>
        /
        <el-tooltip
          effect="dark"
          :content="t('Testbed.Limit')"
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
        :label="t('Testbed.Name')"
        width="180"
      />
      <el-table-column
        prop="microservice"
        :label="t('Testbed.Microservice')"
      />
      <el-table-column
        prop="description"
        :label="t('Testbed.Description')"
      />
      <el-table-column
        prop="localeCreatedTime"
        :label="t('Testbed.CreateTime')"
      />
      <el-table-column
        :label="t('Testbed.ServiceStatus')"
      >
        <template #default="scope">
          <el-tag :type="tagType[scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus]">{{ scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('Testbed.TrafficStatus')"
      >
        <template #default="scope">
          <div class="flex gap-2">
            <el-tag :type="tagType[scope.row.loadIns.status]">{{ scope.row.loadIns.status }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('Testbed.LoadStatus')"
      >
        <template #default="scope">
          <div class="flex gap-2">
            <el-tag
              v-if="scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT"
              :type="tagType[scope.row.loadIns.deleteStatus === null ? scope.row.loadIns.installStatus : scope.row.loadIns.deleteStatus]"
            >{{ scope.row.loadIns.deleteStatus === null ? `Load: ${scope.row.loadIns.installStatus}` : `Delete: ${scope.row.loadIns.deleteStatus}` }}</el-tag>
            <el-tag
              v-else
              type="info"
            >NONEXISTENT</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('Testbed.Operations')"
      >
        <template #default="scope">
          <div class="flex gap-2">
            <el-button
              :type="scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT ? 'danger' : 'default'"
              :disabled="(scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus) !== 'SUCCESS' ||(scope.row.loadIns.status !== LoadItemStatus.RUNNING && scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT) || loadButtonDisable"
              size="small"
              plain
              @click="loadButtonClick(scope.$index)"
            >
              {{ scope.row.loadIns.status !== LoadItemStatus.NONEXISTENT ? t('Testbed.Stop') : t('Testbed.Load') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="!['SUCCESS', 'FAILURE'].includes((scope.row.deleteStatus ? scope.row.deleteStatus : scope.row.installStatus))"
              :loading="scope.row.loadingDisplay"
              @click="deleteTestbed(scope.$index)"
            >
              {{ t('Testbed.Delete') }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      v-model="loadDialogVisible"
      :title="t('Testbed.Create.Title')"
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
          >{{ t('Testbed.Create.Cancel') }}</el-button>
          <el-button
            size="small"
            type="primary"
            @click="createLoad"
          >
            {{ t('Testbed.Create.Confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
