import { service } from '@/core/madison/utils'
import type { TraceRes } from '../types'

export function getTrace(traceId: string) {
  return service<{ task_id: string }>({
    url: '/monitor/traceid',
    method: 'get',
    params: { trace_id: traceId }
  })
}

export function getTraceData(params: { taskId: string }) {
  return service<{ status: string; result: TraceRes }>({
    url: '/monitor/taskresult',
    method: 'get',
    params: { task_id: params.taskId }
  })
}
