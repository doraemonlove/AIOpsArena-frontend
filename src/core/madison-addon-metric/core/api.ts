import { service } from '@/core/madison/utils'
import type {
  MetricNameOptions,
  MetricNameRes,
  PodListOptions,
  PodListRes,
  MachineMetricOptions,
  MachineMetricRes,
  NodeListOptions,
  NodeListRes
} from '../types'

export function getMetricname(options: MetricNameOptions) {
  return service<MetricNameRes>({
    url: '/monitor/metricname',
    method: 'get',
    params: options
  })
}

export function getPodlist(options: PodListOptions) {
  return service<PodListRes>({
    url: '/monitor/podlist',
    method: 'get',
    params: options
  })
}

export function getNodeList(options: NodeListOptions) {
  return service<NodeListRes>({
    url: '/nodelist',
    method: 'get',
    params: options
  })
}

export function getMachinemetric(options: MachineMetricOptions) {
  return service<MachineMetricRes>({
    url: '/machinemetric',
    method: 'get',
    params: {
      namespace: options.namespace,
      metric_name: options.metricName,
      start_time: options.startTime,
      end_time: options.endTime,
      metric_type: options.metricType,
      pod: options.metricType === 'pod' ? options.pod : undefined,
      node: options.metricType === 'node' ? options.node : undefined
    }
  })
}
