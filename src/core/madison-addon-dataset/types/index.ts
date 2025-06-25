export interface QueryDatasetResItem {
  id: number
  dataset_name: string
  status: string
  create_person: string
  create_time: string
  namespace: string
  description: string
  can_delete: boolean
  visible: 'True' | 'False'
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
