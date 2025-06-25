import { service } from '@/core/madison/utils'
import type { DeleteFaultOptions, GetFaultParamsRes, GetFutureInjectionOptions, GetFutureInjectionRes, GetHistoryInjectionOptions, GetHistoryInjectionRes, GetInjectionResOptions, GetInjectionResRes, InjectExperimentOptions, InjectScheduleOptions } from '../types'

export function getFaultParams() {
  return service<GetFaultParamsRes>({
    url: 'chaosmesh/getfaultparams',
    method: 'get'
  })
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
