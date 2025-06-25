export interface TraceItem {
  timestamp: number
  cmdb_id: string
  span_id: string
  duration: number
  type: string
  status_code: number
  operation_name: string
  parent_span: string
}

export type TraceRes = TraceItem[]
