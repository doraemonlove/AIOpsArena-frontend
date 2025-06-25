import type { TracesItem } from '../types'

export class FullTrace {
  readonly traceId: string
  readonly duration: number
  readonly timestamp: number
  readonly operationName: string
  readonly status: string

  constructor(data: TracesItem) {
    this.traceId = data.trace_id
    this.duration = data.duration
    this.timestamp = data.timestamp
    this.operationName = data.operation_name
    this.status = data.status
  }
}
