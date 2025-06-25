import { MadisonAddon } from '@/core/madison/core/addon-base'
import { LoginState } from '@/core/madison-addon-login'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { Topology } from './topology'
import { getNodeList, getNodeTopology } from '../../api'
import { computed, type ComputedRef } from 'vue'
import type { Madison } from '@/core/madison/core'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'

export class Node extends MadisonAddon {
  private __searchedNamespace: Set<string> = new Set()
  private __topologyMap: Map<string, Map<string, Topology>> = new Map()
  private __nodeListPromise: DefPromiseHelper = new DefPromiseHelper()
  private __nodeListGot: boolean = false
  private __nodeList: string[] = []

  get topology(): ComputedRef<Topology[]> {
    return computed(() => {
      const namespace = this.__madison.namespace.paramNamespace.value
      const res = this.__topologyMap.get(namespace)
      if (!res) return []
      return Array.from(res.values()).sort((t1, t2) => t1.name.localeCompare(t2.name))
    })
  }

  get waitingForNodeListGet() {
    return this.__nodeListPromise.promise
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.checkNodeTopology, this)
    madison.routerPromise.addCheck(this.checkNodeList, this)
  }

  logoutCallback(): void {
    this.__searchedNamespace.clear()
    this.__topologyMap.clear()
    this.__nodeListPromise = new DefPromiseHelper()
    this.__nodeListGot = false
  }

  async checkNodeTopology(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (to.name === 'login' || to.name === 'register') return
    if (to.name !== 'metricsmachinenode') return

    await this.__madison.login.waitingForLogin
    if (this.__madison.login.state !== LoginState.LOGGED) return
    const namespace = this.__madison.namespace.queryParamNamespace.value
    if (this.__searchedNamespace.has(namespace)) return
    const res = await getNodeTopology({ namespace })
    const data = res.data
    //
    // 错误的namespace
    //
    if (Object.keys(data.data).length === 0) return
    //
    // 等待获取nodeList
    //
    await this.waitingForNodeListGet
    this.__searchedNamespace.add(namespace)
    if (data.code === 0) {
      const map = new Map<string, Topology>()
      this.__nodeList.forEach((node) => {
        const nodeIns = data.data[node] || []
        map.set(node, new Topology(node, nodeIns, namespace))
      })
      this.__topologyMap.set(namespace, map)
    }
  }

  async checkNodeList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (to.name === 'login' || to.name === 'register') return
    if (to.name !== 'metricsmachinenode') return
    if (this.__nodeListGot) return

    await this.__madison.login.waitingForLogin
    if (this.__madison.login.state !== LoginState.LOGGED) return

    const res = await getNodeList()
    const data = res.data
    if (data.code === 0) {
      this.__nodeList = data.data
    }
    this.__nodeListGot = true
    this.__nodeListPromise.resolve()
  }
}
