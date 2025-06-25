import { service } from '@/core/madison/utils'
import type { TracesOptions, TracesRes } from '../types'

export function getTraces(options: TracesOptions) {
  return service<TracesRes>({
    url: '/monitor/trace',
    method: 'get',
    params: {
      start_time: options.startTime,
      end_time: options.endTime,
      namespace: options.namespace
    }
  })
}
