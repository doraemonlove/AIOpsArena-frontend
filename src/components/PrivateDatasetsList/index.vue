<script setup lang="ts">
import { Madison } from '@/core/madison'
import type { DatasetIns } from '@/core/madison-addon-dataset/core/dataset'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
  return `${log.value ? 'log,' : ''}${metric.value ? 'metric_' + metricStep.value.toString() + ',' : ''}${trace.value ? 'trace' : ''}`
})
const confirmAvailable: ComputedRef<boolean> = computed(() => {
  return !!name.value && timeRange.value !== '' && !!namespace.value
})

function handleDetail(index: number, row: DatasetIns) {
  // console.log(index, row)
}

async function handleVisible(index: number, row: DatasetIns) {
  loading.value = true
  await dataset.updateDatasetVisible(row.id, row.visible ? 'False' : 'True')
  loading.value = false
}

async function handleDelete(index: number, row: DatasetIns) {
  loading.value = true
  await dataset.deleteDataset(row.id)
  loading.value = false
}

function handleDownload(index: number, row: DatasetIns) {
  dataset.upload(row.id)
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

const tagType: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
  'PENDING': 'warning',
  'NONEXISTENT': 'info',
  'RUNNING': 'success',
  'DELETING': 'warning',
  'FAILURE': 'danger',
  'SUCCESS': 'success'
}

function getStatusLabel(status: string) {
  const key = `Dataset.Status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4 pl-4 pr-4">
      <span class="text-xl">{{ t('Dataset.PrivateDatasets') }}</span>
      <el-button
        type="primary"
        plain
        :disabled="loading"
        @click="handleCreate"
      >{{ t('Dataset.Create.Create') }}</el-button>
    </div>
    <el-table
      :data="list"
      style="width: 100%"
    >
      <el-table-column
        prop="name"
        :label="t('Dataset.Table.Name')"
        width="180"
      />
      <el-table-column
        prop="description"
        :label="t('Dataset.Table.Description')"
      />
      <el-table-column
        :label="t('Dataset.Table.CollectStatus')"
      >
        <template #default="scope">
          <el-tag :type="tagType[scope.row.collectStatus]">{{ getStatusLabel(scope.row.collectStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('Dataset.Table.UploadStatus')"
      >
        <template #default="scope">
          <el-tag :type="tagType[scope.row.uploadStatus]">{{ getStatusLabel(scope.row.uploadStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('Dataset.Table.Operations')"
        width="360"
      >
        <template #default="scope">
          <div class="flex gap-4">
            <!-- <el-button
              size="small"
              plain
              :disabled="loading"
              @click="handleDetail(scope.$index, scope.row)"
            >
              Detail
            </el-button> -->
            <el-popover
              placement="top"
              :width="400"
              trigger="click"
            >
              <template #reference>
                <el-button
                  size="small"
                  plain
                  type="primary"
                  :disabled="scope.row.collectStatus !== 'SUCCESS'"
                  @click="handleDownload(scope.$index, scope.row)"
                >
                  {{ t('Dataset.Download') }}
                </el-button>
              </template>
              <div class="flex gap-2 flex-col">
                <div class="flex gap-2">
                  <span>
                    {{ t('Dataset.DownloadPopover.Step1') }}
                  </span>
                  <span :class="{ 'text-[#67C23A]': scope.row.uploadStatus === 'SUCCESS'}">
                    {{ scope.row.uploading ? t('Dataset.DownloadPopover.Uploading') : scope.row.uploadStatus === 'SUCCESS' ? getStatusLabel('SUCCESS') : getStatusLabel(scope.row.uploadStatus) }}
                  </span>
                  <el-icon
                    v-show="scope.row.uploading"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                </div>
                <div class="flex gap-2">
                  <span>
                    {{ t('Dataset.DownloadPopover.Step2') }}
                  </span>
                  <span
                    v-show="scope.row.uploadStatus === 'SUCCESS'"
                    :class="{ 'text-[#67C23A]': scope.row.getURLing === false && scope.row.url}"
                  >
                    {{ scope.row.getURLing ? t('Dataset.DownloadPopover.GettingUrl') : scope.row.url ? getStatusLabel('SUCCESS') : getStatusLabel('FAILURE') }}
                  </span>
                  <a
                    v-show="scope.row.url"
                    class="text-moonlight-500 underline"
                    :href="scope.row.url"
                    target="_blank"
                  >
                    {{ t('Dataset.DownloadPopover.Download') }}
                  </a>
                  <el-icon
                    v-show="scope.row.getURLing"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                </div>
              </div>
            </el-popover>
            <el-button
              size="small"
              plain
              type="primary"
              :disabled="loading"
              @click="handleVisible(scope.$index, scope.row)"
            >
              {{ t('Dataset.Now') }}
              {{ scope.row.visible ? t('Dataset.Visible') : t('Dataset.Invisible') }}
            </el-button>
            <el-button
              size="small"
              plain
              type="danger"
              :disabled="loading || scope.row.uploading"
              @click="handleDelete(scope.$index, scope.row)"
            >{{ t('Dataset.Delete') }}</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      v-model="dialogVisible"
      :title="t('Dataset.Create.Create')"
      width="500px"
    >
      <div class="flex flex-col gap-4">
        <span>{{ t('Dataset.Create.TimeRange') }}</span>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          :range-separator="t('Dataset.Create.To')"
          :start-placeholder="t('Dataset.Create.StartDate')"
          :end-placeholder="t('Dataset.Create.EndDate')"
          :disabled-date="disabledDate"
          style="width: 100%;"
        />
        <span>{{ t('Dataset.Create.DatasetName') }}</span>
        <el-input
          v-model="name"
          :placeholder="t('Dataset.Create.DatasetName')"
        />
        <span>{{ t('Dataset.Create.Description') }}</span>
        <el-input
          v-model="description"
          :placeholder="t('Dataset.Create.Description')"
        />
        <span>{{ t('Dataset.Create.Category') }}</span>
        <div class="flex flex-col gap-2">
          <el-switch
            v-model="log"
            :active-text="t('Dataset.Create.Log')"
            :inactive-text="`${t('Dataset.Create.No')} ${t('Dataset.Create.Log')}`"
          />
          <div class="flex gap-4 items-center">
            <el-switch
              v-model="metric"
              :active-text="t('Dataset.Create.Metric')"
              :inactive-text="`${t('Dataset.Create.No')} ${t('Dataset.Create.Metric')}`"
            />
            <el-input-number
              v-model="metricStep"
              :min="1"
              :max="100"
              :disabled="!metric"
              size="small"
            />
            <span>{{ t('Dataset.Create.MetricStep') }}</span>
          </div>
          <el-switch
            v-model="trace"
            :active-text="t('Dataset.Create.Trace')"
            :inactive-text="`${t('Dataset.Create.No')} ${t('Dataset.Create.Trace')}`"
          />
        </div>
        <span>{{ t('Dataset.Create.Namespace') }}</span>
        <el-select
          v-model="namespace"
          :placeholder="t('Dataset.Create.SelectNamespace')"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <span>{{ t('Dataset.Create.Visibility') }}</span>
        <el-switch
          v-model="visible"
          :active-text="t('Dataset.Create.Visible')"
          :inactive-text="t('Dataset.Create.Invisible')"
        />
      </div>
      <template #footer>
        <div class="flex gap-4 justify-end">
          <el-button
            :disabled="loading"
            @click="dialogVisible = false"
          >{{ t('Dataset.Create.Cancel') }}</el-button>
          <el-button
            :disabled="!confirmAvailable || loading"
            type="primary"
            @click="createConfirm"
          >
            {{ t('Dataset.Create.Confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
