export type LeaderboardStatus = 'running' | 'finished' | 'failed' | string

export interface LeaderboardMetricLeaf {
  key: string
  label: string
  path: string[]
}

export interface LeaderboardMetricGroup {
  key: string
  label: string
  children: LeaderboardMetricLeaf[]
}

export interface AlgorithmTypeOption {
  id: number
  name: string
}

export interface LeaderboardRecord {
  id: number
  name: string
  status: LeaderboardStatus
  description?: string
  run_count: number
  visibility: boolean
  algorithm_type_id: number | null
  algorithm_type_name: string
  dataset_id: number | null
  dataset_name: string
  owner_id: number | null
  owner_name: string
  is_owner: boolean
  created_at: string
  updated_at: string
}

export interface LeaderboardItem {
  item_id: number
  algorithm_id?: number | null
  algorithm_name: string
  source_run_id?: number | null
  test_run_id?: number | null
  item_status?: string | null
  run_status?: string | null
  evaluation_status?: string | null
  metrics_json?: Record<string, any> | null
  error_message?: string | null
  evaluation_error?: string | null
  created_at?: string
  updated_at?: string
}

export interface LeaderboardDetail extends LeaderboardRecord {
  items: LeaderboardItem[]
}

export interface CreateLeaderboardPayload {
  name: string
  algorithm_type_id: number
  dataset_id: number
  source_run_ids: number[]
  description?: string
  visibility: boolean
}

export interface DeleteLeaderboardPayload {
  leaderboard_record_id: number
}

export interface DeleteLeaderboardItemPayload {
  item_id: number
}

export interface RerunLeaderboardItemPayload {
  item_id: number
}

export interface ToggleLeaderboardVisibilityPayload {
  leaderboard_record_id: number
}

export interface ToggleLeaderboardVisibilityRes {
  leaderboard_record_id: number
  visibility: boolean
  updated_at?: string
}

export interface ListLeaderboardParams {
  algorithm_type_id?: number
}

export interface AvailableTrainRunItem {
  id: number
  template_id?: number | null
  algorithm_id?: number | null
  algorithm_name: string
  algorithm_type_id?: number | null
  algorithm_type?: string
  algorithm_type_name?: string
  dataset_id?: number | null
  dataset_name?: string
  status?: string | null
  created_at?: string
  finished_at?: string | null
}

export type ListLeaderboardRes = LeaderboardRecord[]
export type ListAvailableTrainRunsRes = AvailableTrainRunItem[]
