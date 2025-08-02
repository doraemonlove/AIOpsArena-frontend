export interface TracesItem {
  trace_id: string
  duration: number
  timestamp: number
  operation_name: string
  status: string
}

export type TracesRes = TracesItem[]

export interface TracesOptions {
  startTime: number
  endTime: number
  namespace: string
}
