import { deepClone } from '@/core/madison/utils'
import type { MetricNameRes } from '../types'

export class MetricName {
  private __metricName: MetricNameRes
  private __machine: MachineMetric

  get machine() {
    return this.__machine
  }

  get metricName(): MetricNameRes {
    return deepClone(this.__metricName)
  }

  constructor(data: MetricNameRes) {
    this.__metricName = data
    this.__machine = new MachineMetric(data.machine)
  }
}

class MachineMetric {
  private __node: MachineMetricDetail
  private __pod: MachineMetricDetail

  get node() {
    return this.__node
  }

  get pod() {
    return this.__pod
  }

  constructor(data: { node: Record<string, string[]>; pod: Record<string, string[]> }) {
    this.__node = new MachineMetricDetail(data.node)
    this.__pod = new MachineMetricDetail(data.pod)
  }
}

class MachineMetricDetail {
  private __keys: string[] = []
  private __fullMetricName: string[] = []
  private __data: { name: string; metricName: string[] }[] = []

  get keys() {
    return Array.from(this.__keys)
  }

  get fullMetricName() {
    return Array.from(this.__fullMetricName)
  }

  get data(): { name: string; metricName: string[] }[] {
    return deepClone(this.__data)
  }

  constructor(data: Record<string, string[]>) {
    this.__keys = Object.keys(data)
    this.__fullMetricName = this.__keys.reduce<string[]>((prev, curr) => {
      return [...prev, ...data[curr]]
    }, [])
    this.__data = this.__keys.map((key) => {
      return {
        name: key,
        metricName: data[key]
      }
    })
  }

  get(key: string) {
    return this.__data.find((item) => item.name === key)
  }

  has(metricName: string) {
    return this.__fullMetricName.includes(metricName)
  }
}
