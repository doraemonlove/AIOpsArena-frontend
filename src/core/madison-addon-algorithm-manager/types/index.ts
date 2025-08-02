export interface AlgorithmItem {
  id: number
  algorithm_name: string
  algorithm_type: string
  indicator_name: string
  cpu_count: string
  mem_limit: string
  container_created: boolean
  container_id: string
  container_status: boolean
  is_split: boolean
}

export type GetAlgorithmsRes = AlgorithmItem[]

export interface IndicatorItem {
  indicator_name: string
  format_json: string
}

export type GetIndicatorsRes = IndicatorItem[]

export interface ImportAlgorithmOptions {
  uploadedFile: File
  indicatorName: string
  algorithmName: string
  algorithmType: string
  isSplit: boolean
  datasetType: 'log' | 'metric' | 'trace'
}

export interface ImportAlgorithmRes {
  data: string // id
}

export interface DeleteAlgorithmOptions {
  algorithmName: string
}

export interface DeleteAlgorithmRes {
  data: string // id
}

export interface StartContainerOptions {
  algorithmName: string
  cpuCount: string
  memLimit: string
}

export interface DeleteContainerOptions {
  algorithmName: string
}

export interface RestartContainerOptions {
  algorithmName: string
}

export interface DownloadDatasetRes {}

export interface ExportAlgorithmOptions {}

export interface GetContainerLogOptions {
  id: string
}
