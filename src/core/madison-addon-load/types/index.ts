export type CreateLoadOptions = Record<string, number | string>

export interface CreateLoadRes {
  load_id: number
}

export interface GetInstallResultRes {
  status: 'PENDING' | 'STARTED' | 'FAILURE' | 'SUCCESS'
}

export interface DeleteLoadOptions {
  loadId: number
}

export interface GetDeleteResultRes {
  status: 'PENDING' | 'STARTED' | 'FAILURE' | 'SUCCESS'
}

export interface GetParamsOptions {
  microserviceTypeId: number
}

export type GetParamsRes = Record<string, number | string>

export interface GetLoadInfoRes {
  id: number
  load_generator_id: number
  namespace: string
  params: any
  created_person_id: number
  created_time: string
  pod_name: string
  install_status: string | null
  install_task_id: string | null
  delete_status: string | null
  delete_task_id: string | null
}

export enum LoadItemStatus {
  UNKNOWN = 'UNKNOWN',
  NONEXISTENT = 'NONEXISTENT',
  LOADING = 'LOADING',
  RUNNING = 'RUNNING',
  DELETING = 'DELETING',
  QUERYING = 'QUERYING',
  FAILURE = 'FAILURE'
}
