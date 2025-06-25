import type { LogsItem } from '../types'

export class FullLogs {
  readonly logId: string
  readonly message: string
  readonly timestamp: number
  readonly podName: string
  readonly data: LogsItem

  constructor(data: LogsItem) {
    this.logId = data._id
    this.message = data._source.message || 'unknown'
    this.timestamp = new Date(data._source['@timestamp']).getTime()
    this.podName = data._source.k8_pod
    this.data = data
  }
}
