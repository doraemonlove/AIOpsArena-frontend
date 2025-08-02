<script setup lang="ts">
import { Madison } from '@/core/madison'
import type { DatasetIns } from '@/core/madison-addon-dataset/core/dataset'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const madison = Madison.getInstance()
const dataset = madison.dataset
const list = dataset.publicDatasets
const canRefresh = dataset.canRefresh
const refreshTime = dataset.refreshTime

function handleDetail (index: number, row: DatasetIns) {
  // console.log(index, row)
}

function handleDownload (index: number, row: DatasetIns) {
  dataset.downloadPublic(row.id)
}

</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-4 pl-4 pr-4 justify-between">
      <span class="text-xl">{{ t('Dataset.PublicDatasets') }}</span>
      <el-button
        type="primary"
        plain
        :disabled="!canRefresh"
        @click="dataset.refresh()"
      >
        {{ canRefresh ? t('Dataset.Refresh') : refreshTime + 's' }}
      </el-button>
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
          <div class="flex gap-4">
            <!-- <el-button
              size="small"
              plain
              @click="handleDetail(scope.$index, scope.row)"
            >Detail</el-button> -->
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
                  @click="handleDownload(scope.$index, scope.row)"
                >
                  {{ t('Dataset.Download') }}
                </el-button>
              </template>
              <div class="flex gap-2 flex-col">
                <div class="flex gap-2">
                  <span>
                    Step 1: upload
                  </span>
                  <span>
                    {{ scope.row.uploading ? 'Uploading' : scope.row.uploadStatus === 'SUCCESS' ? 'Uploaded' : scope.row.uploadStatus }}
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
                    Step 2: get URL
                  </span>
                  <span>
                    {{ scope.row.getURLing ? 'Getting URL...' : scope.row.url ? 'SUCCESS' : 'FAILURE' }}
                  </span>
                  <a
                    v-show="scope.row.url"
                    class="text-mooblight-500 underline"
                    :href="scope.row.url"
                    target="_blank"
                  >
                    Download
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
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
