import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { getMetricname } from './api'
import { MetricName } from './metric-name'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import { Machine } from './machine'
import type { Madison } from '@/core/madison/core'
import { message } from '@/core/madison/utils'

export class Metric extends MadisonAddon {
  private __metricNameSearchedNamespace: Set<string> = new Set()
  private __metricNameGotPromise: DefPromiseHelper = new DefPromiseHelper()
  /**
   * <namespace, >
   */
  private __metricName: Map<string, MetricName> = new Map()

  readonly machine: Machine

  get waitingForMetricName() {
    return this.__metricNameGotPromise.promise
  }

  constructor(madison: Madison) {
    super(madison)

    this.machine = new Machine(madison)

    madison.routerPromise.addCheck(this.checkMetricName, this)
  }

  logoutCallback(): void {
    this.__metricNameSearchedNamespace.clear()
    this.__metricNameGotPromise = new DefPromiseHelper()
  }

  async checkMetricName(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(
      to,
      from,
      (to) => this.includes(to, 'metric')
    )
    if (!can) return
    const namespace = (to.query.namespace as string) || ''
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) {
      message('Wrong namespace')
      this.__metricNameGotPromise.resolve()
      return {
        name: 'data',
        query: {}
      }
    }
    //
    // namespace已经被搜索过
    //
    if (this.__metricNameSearchedNamespace.has(namespace)) return
    const res = await getMetricname({ namespace })
    const data = res.data
    if (data.code === 0) {
      this.__metricName.set(namespace, new MetricName(data.data))
    }
    this.__metricNameSearchedNamespace.add(namespace)
    this.__metricNameGotPromise.resolve()
  }

  hasNamespace(namespace: string) {
    return this.__metricNameSearchedNamespace.has(namespace)
  }

  getMetricName(namespace: string) {
    return this.__metricName.get(namespace)
  }
}
