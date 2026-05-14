export interface MetricNameOptions {
  namespace: string
}

export interface MetricCategoryMap {
  [groupName: string]: string[]
}

export interface MetricNameRes {
  machine: {
    node: MetricCategoryMap
    pod: MetricCategoryMap
  }
  service: {
    istio: string[]
  }
  business: {}
}

export interface MetricNameApiRes {
  infra_node?: string[]
  infra_pod?: string[]
  service_istio?: string[]
  tidb_core?: string[]
  machine?: {
    node: MetricCategoryMap
    pod: MetricCategoryMap
  }
  service?: {
    istio: string[]
  }
  business?: {}
}

export interface PodListOptions {
  namespace: string
}

export type PodListRes = string[]

export interface NodeListOptions {
  namespace: string
}

export type NodeListRes = string[]

export type MetricType = 'pod' | 'node'

export type MachineMetricOptions =
  | {
      namespace: string
      pod: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'pod'
    }
  | {
      namespace: string
      node: string
      metricName: string
      startTime: number
      endTime: number
      metricType: 'node'
    }

interface MachineMetricResItemMetric extends Record<string, string> {
  __name__: string
}

export interface MachineMetricResItem {
  metric: MachineMetricResItemMetric
  values: [number, string][]
}

export type MachineMetricRes = MachineMetricResItem[]
