import { service } from '@/core/madison/utils'
import type { TracesOptions, TracesRes } from '../types'

export function getTraces(options: TracesOptions) {
  return service<{ task_id: string }>({
    url: '/monitor/trace',
    method: 'get',
    params: {
      start_time: options.startTime,
      end_time: options.endTime,
      namespace: options.namespace
    }
  })
}

export function getTracesData(params: {taskId: string}) {
  return service<{status: string, result: TracesRes }>({
    url: '/monitor/taskresult',
    method: 'get',
    params: {
      task_id: params.taskId
    }
  })
}
