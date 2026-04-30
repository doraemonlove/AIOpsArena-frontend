import { service } from '@/core/madison/utils'
import type { MadisonApiRes } from '@/core/madison/types'
import { BACKEND_BASE_URL } from '@/core/madison-addon-platform-assistant/types'
import type {
  DeleteFaultOptions,
  FaultSchema,
  FaultSchemaTypeItem,
  GetFutureInjectionOptions,
  GetFutureInjectionRes,
  GetHistoryInjectionOptions,
  GetHistoryInjectionRes,
  GetInjectionResOptions,
  GetInjectionResRes,
  InjectExperimentOptions,
  InjectScheduleOptions
} from '../types'

export async function getFaultTypes() {
  const response = await service<FaultSchemaTypeItem[]>({
    baseURL: BACKEND_BASE_URL,
    url: 'chaosmesh/fault_types',
    method: 'get'
  })

  const payload = response.data as MadisonApiRes<FaultSchemaTypeItem[]> | FaultSchemaTypeItem[]
  if (Array.isArray(payload)) return payload
  return payload.data || []
}

export async function getFaultSchema(templateName: string, microservice: string) {
  const response = await service<FaultSchema>({
    baseURL: BACKEND_BASE_URL,
    url: 'chaosmesh/fault_schema',
    method: 'get',
    params: {
      template_name: templateName,
      microservice
    }
  })

  const payload = response.data as MadisonApiRes<FaultSchema> | FaultSchema
  if (Array.isArray(payload)) return payload[0] || null
  if ('data' in payload) return payload.data || null
  return payload || null
}

export function injectExperiment(options: InjectExperimentOptions) {
  return service<{}>({
    url: 'chaosmesh/inject/experiment',
    method: 'post',
    data: {
      data: {
        ...options,
        template_name: options.templateName,
        fault_type: options.faultType,
        clock_time: options.clockTime
      }
    }
  })
}

export function injectSchedule(options: InjectScheduleOptions) {
  return service<{}>({
    url: 'chaosmesh/inject/schedule',
    method: 'post',
    data: {
      data: {
        ...options,
        template_name: options.templateName,
        fault_type: options.faultType
      }
    }
  })
}

export function getFutureInjection(options: GetFutureInjectionOptions) {
  return service<GetFutureInjectionRes>({
    url: 'chaosmesh/getfuture',
    method: 'get',
    params: {
      ...options,
      start_time: options.startTime,
      end_time: options.endTime
    }
  })
}

export function getHistoryInjection(options: GetHistoryInjectionOptions) {
  return service<GetHistoryInjectionRes>({
    url: 'chaosmesh/gethistory',
    method: 'get',
    params: {
      ...options,
      start_time: options.startTime,
      end_time: options.endTime
    }
  })
}

export function getInjectionResult(options: GetInjectionResOptions) {
  return service<GetInjectionResRes>({
    url: 'chaosmesh/getresult',
    method: 'get',
    params: {
      task_id: options.taskId
    }
  })
}

export function deleteFault(options: DeleteFaultOptions) {
  return service<{}>({
    url: 'chaosmesh/deletefault',
    method: 'get',
    params: {
      fault_id: options.faultId
    }
  })
}
