import { service } from '@/core/madison/utils'
import type { TraceRes } from '../types'

export function getTrace(traceId: string) {
  return service<TraceRes>({
    url: '/monitor/traceid',
    method: 'get',
    params: { trace_id: traceId }
  })
}
