export interface MetricNameOptions {
  namespace: string
}

export type MetricType = 'node' | 'pod' | 'service' | 'tidb'

export interface MetricNameRes {
  node: string[]
  pod: string[]
  service: string[]
  tidb: string[]
}

export type MetricNameApiRes = MetricNameRes

export interface PodListOptions {
  namespace: string
}

export type PodListRes = string[]

export interface NodeListOptions {
  namespace: string
}

export type NodeListRes = string[]

export type MachineMetricOptions =
  | {
      namespace: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'node'
      node: string
    }
  | {
      namespace: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'pod'
      pod: string
    }
  | {
      namespace: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'service'
      service: string
    }
  | {
      namespace: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'tidb'
    }

interface MachineMetricResItemMetric extends Record<string, string> {
  __name__: string
}

export interface MachineMetricResItem {
  metric: MachineMetricResItemMetric
  values: [number, string][]
}

export type MachineMetricRes = MachineMetricResItem[]
