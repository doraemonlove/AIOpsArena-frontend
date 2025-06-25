export interface LogsItem {
  _index: string,
  _type: string,
  _id: string,
  _score: number,
  _source: {
      k8_namespace: string,
      message: string,
      k8_pod: string,
      k8_node_name: string,
      agent_name: string,
      '@timestamp': string
  }
}

export type LogsRes = LogsItem[]

export interface LogsOptions {
  startTime: number
  endTime: number
  namespace: string
}
