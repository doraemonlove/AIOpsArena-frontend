import type { Ref } from 'vue'

export interface FaultParam {
  templateName?: string
  name: string
  category: string
  type: string
  description: string
  params: Record<string, FaultParamField>
}

export interface FaultParamOption {
  label: string
  value: string
}

export interface FaultParamField {
  type: string
  description: string
  required?: boolean
  defaultValue?: string | number | boolean | string[]
  example?: string | number | boolean | string[]
  options?: FaultParamOption[]
  enumValues?: Array<string | number | boolean>
  specialValues?: Array<string | number | boolean>
}

export interface FaultTypeListItem {
  templateName: string
  name: string
  category: string
  type: string
  description: string
  requiredParams: string[]
  targetCandidates: string[]
}

export interface FaultSchemaTypeItem {
  template_name: string
  name: string
  category: string
  type: string
  description: string
  required_params: string[]
  target_candidates: string[]
}

export interface FaultSchemaParam {
  type?: string
  description?: string
  required?: boolean
  default_value?: string | number | boolean | string[]
  example?: string | number | boolean | string[]
  candidates?: Array<string | number | boolean | { label?: string; value?: string | number | boolean; name?: string }>
  options?: Array<string | number | boolean | { label?: string; value?: string | number | boolean; name?: string }>
  enum_values?: Array<string | number | boolean>
  special_values?: Array<string | number | boolean>
}

export interface FaultSchema {
  template_name: string
  name?: string
  category?: string
  type?: string
  description?: string
  required_params?: string[]
  target_candidates?: string[]
  params?: Record<string, FaultSchemaParam>
}

export interface InjectExperimentOptions {
  templateName: string
  faultType: string
  clockTime: string
  params: Record<string, any>
}

export interface InjectScheduleOptions {
  templateName: string
  faultType: string
  schedule: string
  params: Record<string, any>
}

export interface GetFutureInjectionOptions {
  startTime: number
  endTime: number
  namespace: string
}

export interface GetFutureInjectionRes {
  task_id: string
}

export interface GetHistoryInjectionOptions {
  startTime: number
  endTime: number
  namespace: string
}

export interface GetHistoryInjectionRes {
  task_id: string
}

export interface GetInjectionResOptions {
  taskId: string
}

export interface GetInjectionResItem {
  id: string
  name: string
  timestamp: number
  kind: string
  spec: {
    selector: any
    mode: string
    action: string
    duration: string
  }
}

export interface GetInjectionResItemHistory {
  id: string
  name: string
  timestamp: number
  kind: string
  spec: {
    selector: any
    mode: string
    action: string
    duration: string
  }
}

export interface GetInjectionResRes {
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE'
  result: GetInjectionResItem[] | Record<string, GetInjectionResItemHistory>
}

export interface GetInjectionResForManager {
  id: string
  name: string
  timestamp: number
  duration: number
  meta?: any
}

export interface DeleteFaultOptions {
  faultId: string
}

export type ParamsMapValue =
  | {
      value: Ref<string[]>
      component: 'el-select-multiple'
      name: 'targetpods'
      type: 'array'
      meta: any
      description: string
      options: { label: string; value: string }[]
    }
  | {
      value: Ref<string[]>
      component: 'el-select-multiple'
      name: 'pods'
      type: 'array'
      meta: any
      description: string
      options: { label: string; value: string }[]
    }
  | {
      value: Ref<string>
      component: 'el-select'
      name: string
      type: 'string'
      meta: any
      description: string
      options: { label: string; value: string }[]
    }
  | {
      value: Ref<string>
      component: 'el-input'
      name: string
      type: 'string'
      meta: any
      description: string
    }
  | {
      value: Ref<number>
      component: 'el-input-number'
      name: string
      type: 'number'
      meta: any
      description: string
    }
  | {
      value: Ref<boolean>
      component: 'el-switch'
      name: string
      type: 'boolean'
      meta: any
      description: string
    }
  | {
      value: Ref<string[]>
      component: 'el-select-multiple'
      name: string
      type: 'array'
      meta: any
      description: string
      options: { label: string; value: string }[]
    }
