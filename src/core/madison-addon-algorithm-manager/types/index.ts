export type AlgorithmImportStatus = 'importing' | 'ready' | 'failed' | string

export type AlgorithmImageStatus = 'not_built' | 'building' | 'ready' | 'failed' | string

export type AlgorithmDatasetType = 'log' | 'metric' | 'trace'

export interface AlgorithmTypeItem {
  id?: number
  name?: string
  algorithm_type?: string
  description?: string
}

export type ListAlgorithmTypeRes = Array<string | AlgorithmTypeItem>

export interface AlgorithmItem {
  template_id: number
  algorithm_name: string
  algorithm_type: string
  algorithm_type_id?: number | null
  description: string
  owner_id?: number | null
  owner_name: string
  visibility: boolean
  status: AlgorithmImportStatus
  image_status: AlgorithmImageStatus
  created_at: string
  dataset_type?: string
}

export type ListAlgorithmRes = AlgorithmItem[]

export interface ImportAlgorithmOptions {
  algorithm_name: string
  algorithm_type: string
  dataset_type: string
  visibility: boolean
  file: File
}

export type ImportAlgorithmRes =
  | number
  | string
  | {
      template_id?: number | string
      id?: number | string
      data?: number | string
    }

export interface ImportAlgorithmStatusRes {
  template_id?: number
  status: AlgorithmImportStatus
}

export interface BuildAlgorithmImageOptions {
  template_id: number
}

export interface BuildAlgorithmImageStatusRes {
  template_id?: number
  image_status: AlgorithmImageStatus
}

export interface DeleteAlgorithmOptions {
  template_id: number
}

export interface ToggleAlgorithmVisibilityOptions {
  template_id: number
}

export interface ToggleAlgorithmVisibilityRes {
  template_id: number
  visibility: boolean
  updated_at?: string
}

export type TrainRunStatus =
  | 'waiting'
  | 'starting'
  | 'running'
  | 'finished'
  | 'failed'
  | 'canceled'
  | string

export type RunStatus = TrainRunStatus

export type EvaluationStatus = 'pending' | 'success' | 'failed' | 'skipped' | string

export interface TrainRunItem {
  id: number
  template_id: number
  algorithm_name: string
  algorithm_type: string
  algorithm_deleted: boolean
  algorithm_visibility?: boolean
  owner_id?: number
  owner_name?: string
  dataset_id?: number | null
  dataset_name?: string
  mode: string
  status: TrainRunStatus
  source_run_id?: number | null
  evaluation_status?: EvaluationStatus | null
  exit_code?: number | null
  error_message?: string | null
  evaluation_error?: string | null
  artifacts_path?: string | null
  log_path?: string | null
  config_json?: Record<string, any> | null
  algorithm_config?: Record<string, any> | null
  result_json?: Record<string, any> | null
  metrics_json?: Record<string, any> | null
  created_at?: string
  started_at?: string | null
  finished_at?: string | null
}

export type ListTrainRunsRes = TrainRunItem[]
export type TestRunItem = TrainRunItem
export type ListTestRunsRes = TestRunItem[]

export interface RunAlgorithmOptions {
  template_id: number
  mode: 'train'
  dataset_id: number
  algorithm_config: Record<string, any>
}

export interface RunTestOptions {
  template_id: number
  mode: 'test'
  dataset_id: number
  source_run_id: number
  algorithm_config: Record<string, any>
}

export type RunAlgorithmRes =
  | number
  | string
  | {
      run_id?: number | string
      id?: number | string
      status?: TrainRunStatus
      data?: number | string | Record<string, any>
    }

export interface DeleteAlgorithmRunOptions {
  run_id: number
}

export interface CancelRunOptions {
  run_id: number
}

export interface TrainRunDetail extends TrainRunItem {
  [key: string]: any
}

export type RunDetail = TrainRunDetail
export type RunLogResponse = GetRunLogRes
export type RunAlgorithmPayload = RunTestOptions

export interface AvailableTrainRunItem {
  id: number
  template_id: number
  algorithm_name: string
  algorithm_type: string
  dataset_id?: number | null
  dataset_name?: string
  status?: RunStatus
  created_at?: string
  finished_at?: string | null
  checkpoint_path?: string | null
  checkpoints_path?: string | null
}

export type ListAvailableTrainRunsRes = AvailableTrainRunItem[]

export type GetRunLogRes =
  | string
  | {
      log?: string
      content?: string
      data?: string
      text?: string
      [key: string]: any
    }

export interface AlgorithmGroup {
  type: string
  items: AlgorithmItem[]
}
