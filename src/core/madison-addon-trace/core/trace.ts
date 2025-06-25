import type { TraceRes, TraceItem } from '../types'

export class TraceDetail {
  readonly useful: boolean = true
  readonly children: TraceDetail[] = []
  readonly parentSpan: string
  readonly spanId: string = ''
  /**
   * 时间戳，单位：微秒
   */
  readonly timestamp: number = 0
  readonly cmdbId: string = ''
  /**
   * 持续时间，单位：微秒
   */
  readonly duration: number = 0
  readonly type: string = ''
  readonly operationName: string = ''
  readonly statusCode: number = 0

  constructor(data: TraceRes, parentSpan: string) {
    const res = this.init(data, parentSpan)
    this.parentSpan = parentSpan
    if (res === undefined) {
      this.useful = false
      return
    }
    this.spanId = res.span_id
    this.timestamp = res.timestamp * 1000 // 毫秒 to 微秒
    this.cmdbId = res.cmdb_id
    this.duration = res.duration // 微秒
    this.type = res.type
    this.operationName = res.operation_name
    this.statusCode = res.status_code

    while (true) {
      const td = new TraceDetail(data, this.spanId)
      if (!td.useful) break
      this.children.push(td)
    }
  }

  private init(data: TraceRes, parentSpan: string): undefined | TraceItem {
    const res = data.find((item) => item.parent_span === parentSpan)
    const index = data.findIndex((item) => item.parent_span === parentSpan)
    if (res === undefined) return undefined
    data.splice(index, 1)
    return res
  }
}
