import { deepClone } from '@/core/madison/utils'
import type { MetricNameApiRes, MetricNameRes, MetricType } from '../types'

export class MetricName {
  private __metricName: MetricNameRes
  private __details: Record<MetricType, MetricDetail>

  get metricName(): MetricNameRes {
    return deepClone(this.__metricName)
  }

  constructor(data: MetricNameApiRes) {
    this.__metricName = {
      node: data.node || [],
      pod: data.pod || [],
      service: data.service || [],
      tidb: data.tidb || []
    }
    this.__details = {
      node: new MetricDetail('Node Metrics', this.__metricName.node),
      pod: new MetricDetail('Pod Metrics', this.__metricName.pod),
      service: new MetricDetail('Service Metrics', this.__metricName.service),
      tidb: new MetricDetail('TiDB Metrics', this.__metricName.tidb)
    }
  }

  getByType(type: MetricType) {
    return this.__details[type]
  }
}

class MetricDetail {
  private __title: string
  private __fullMetricName: string[]
  private __data: { name: string; metricName: string[] }[]

  get title() {
    return this.__title
  }

  get fullMetricName() {
    return Array.from(this.__fullMetricName)
  }

  get data(): { name: string; metricName: string[] }[] {
    return deepClone(this.__data)
  }

  constructor(title: string, metrics: string[]) {
    this.__title = title
    this.__fullMetricName = Array.from(new Set(metrics))
    this.__data = [
      {
        name: title,
        metricName: this.__fullMetricName
      }
    ]
  }

  has(metricName: string) {
    return this.__fullMetricName.includes(metricName)
  }
}
