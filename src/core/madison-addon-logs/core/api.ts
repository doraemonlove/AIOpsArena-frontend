import { service } from '@/core/madison/utils'
import type { LogsOptions, LogsRes } from '../types'

export function getLogs(options: LogsOptions) {
  return service<{ task_id: string }>({
    url: '/monitor/log',
    method: 'get',
    params: {
      start_time: options.startTime,
      end_time: options.endTime,
      namespace: options.namespace
    }
  })
}

export function getLogsData(params: { taskId: string }) {
  return service<{ status: string; result: LogsRes }>({
    url: '/monitor/taskresult',
    method: 'get',
    params: {
      task_id: params.taskId
    }
  })
}
