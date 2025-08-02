import { service } from '@/core/madison/utils'
import type { CreateDatasetOptions, DatasetStatus, DeleteDatasetOptions, QueryDatasetRes, UpdateDatasetVisibleOptions } from '../types'

export function createDataset(options: CreateDatasetOptions) {
  return service<{}>({
    url: '/dataset/create',
    method: 'post',
    data: {
      start_time: options.startTime,
      end_time: options.endTime,
      namespace: options.namespace,
      dataset_name: options.datasetName,
      description: options.description,
      category: options.category,
      visible: options.visible
    }
  })
}

export function queryDataset() {
  return service<QueryDatasetRes>({
    url: '/dataset/query',
    method: 'get'
  })
}

export function deleteDataset(options: DeleteDatasetOptions) {
  return service<{}>({
    url: '/dataset/delete',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}

export function updateDatasetVisible(options: UpdateDatasetVisibleOptions) {
  return service<{}>({
    url: '/dataset/updatevisible',
    method: 'get',
    params: {
      dataset_id: options.datasetId,
      visible: options.visible
    }
  })
}

export function interruptCollect(options: { datasetId: number }) {
  return service<{}>({
    url: '/dataset/interrupt',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}

export function uploadDataset(options: { datasetId: number }) {
  return service<{}>({
    url: '/dataset/upload',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}

export function getDownloadURL(options: { datasetId: number }) {
  return service<{ download_url: string }>({
    url: '/dataset/getdownloadurl',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}

export function getCollectStatus(options: { datasetId: number }) {
  return service<{ status: DatasetStatus }>({
    url: '/dataset/getcollectresult',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}

export function getUploadStatus(options: { datasetId: number }) {
  return service<{ status: DatasetStatus }>({
    url: '/dataset/getuploadresult',
    method: 'get',
    params: {
      dataset_id: options.datasetId
    }
  })
}
