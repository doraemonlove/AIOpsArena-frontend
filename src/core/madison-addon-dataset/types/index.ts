export interface QueryDatasetResItem {
  id: number,
  dataset_name: string,
  collect_status: DatasetStatus | null,
  upload_status: DatasetStatus | null,
  description: string,
  create_person: string,
  create_time: string,
  namespace: string,
  microservice_name: null,
  visible: 'True' | 'False',
  can_delete: boolean
}

export enum DatasetStatus {
  NONEXISTENT = 'NONEXISTENT',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export enum DatasetDownloadStep {
  READY = 'READY',
  COLLECTING = 'COLLECTING',
  UPLOADING = 'UPLOADING',
  GETURLING = 'GETURLING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export type QueryDatasetRes = QueryDatasetResItem[]

export interface DeleteDatasetOptions {
  datasetId: number
}

export interface UpdateDatasetVisibleOptions {
  datasetId: number
  visible: string
}

export interface CreateDatasetOptions {
  startTime: string
  endTime: string
  namespace: string
  datasetName: string
  visible: string
  description: string
  category: string
}
