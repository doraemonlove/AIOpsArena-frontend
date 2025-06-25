import { MadisonAddon } from '@/core/madison/core/addon-base'
import { CalendarFaultsManager, CalendarFaultsRenderManager } from './fault-history'
import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { deleteFault, getFaultParams } from './api'
import { getPodlist } from '@/core/madison-addon-metric/core/api'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import type { GetFaultParamsRes } from '../types'
import { FaultDetail } from './fault'
import { computed, ref, type ComputedRef, type Ref } from 'vue'

export class FaultManager extends MadisonAddon {
  private __dataIsGotten = false

  private __faultParams: GetFaultParamsRes = {}
  private __faultParamsPromise: DefPromiseHelper = new DefPromiseHelper()
  get waitingForFaultParamsLoad() {
    return this.__faultParamsPromise.promise
  }
  readonly calendarFaultsManager: CalendarFaultsManager

  private __podListMap: Map<string, string[]> = new Map()

  // Map<namespace, Map<cayegory, Map<name, FaultDetail>>>
  private __faultsData: Map<string, Map<string, Map<string, FaultDetail>>> = new Map()

  private __namespace: Ref<string> = ref('')

  selectedFaultName: Ref<string[]> = ref([])

  readonly cascaderOptions: ComputedRef<
    {
      label: string
      value: string
      children: {
        label: string
        value: string
      }[]
    }[]
  > = computed(() => {
      const namespace = this.__namespace.value
      const faults = this.__faultsData.get(namespace) || new Map<string, Map<string, FaultDetail>>()
      return Array.from(faults.entries()).map(([key, value]) => {
        return {
          label: key,
          value: key,
          children: Array.from(value.keys()).map((key) => {
            return {
              label: key,
              value: key
            }
          })
        }
      })
    })

  readonly selectedFaultIns: ComputedRef<FaultDetail | null> = computed(() => {
    const namespace = this.__namespace.value
    const path = this.selectedFaultName.value
    if (
      namespace === '' ||
      namespace === CalendarFaultsRenderManager.CAL_DEF_NAMESPACE ||
      path.length < 2
    ) { return null }
    const v1 = this.cascaderOptions.value.find((item) => item.value === path[0])
    if (!v1) return null
    const category = v1.value
    const v2 = v1.children.find((item) => item.value === path[1])
    if (!v2) return null
    const name = v2.value
    const faultIns = this.__faultsData.get(namespace)?.get(category)?.get(name)
    return faultIns || null
  })

  constructor(madison: Madison) {
    super(madison)

    this.calendarFaultsManager = new CalendarFaultsManager(madison, this)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addCheck(this.checkNeedNamespace, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  private precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {}

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (this.__dataIsGotten) return
    const can = await this.defNoNSCheck(to, from, 'faultinjection')
    if (!can) return
    const res = await getFaultParams()
    const data = res.data
    this.__faultParams = data.data
    this.__faultParamsPromise.resolve()
  }

  private async checkNeedNamespace(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defQNSCheck(to, from, 'faultinjection')
    if (!can) return
    const namespace = this.__madison.namespace.queryQueryNamespace.value
    if (!this.__faultsData.has(namespace)) this.__faultsData.set(namespace, new Map())
    const promises = [this.loadPodList(namespace)]
    await this.waitingForFaultParamsLoad
    await this.__madison.namespace.waitingForNamespaceGet
    await Promise.allSettled(promises)

    this.checkPodFaults(namespace)
  }

  private postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    this.__namespace.value = to.query.namespace as string
    return
  }

  private checkPodFaults(namespace: string) {
    const faultsMap = this.__faultsData.get(namespace) as Map<string, Map<string, FaultDetail>>
    if (!faultsMap.has('pod')) faultsMap.set('pod', new Map())
    const podFaultsMap = faultsMap.get('pod') as Map<string, FaultDetail>
    const podList = this.__podListMap.get(namespace)
    if (!podList) {
      console.warn(`podList is null ${namespace}`)
      return
    }
    const podFaults = Object.values(this.__faultParams).filter((v) => v.category === 'pod')
    podFaults.forEach((fault) => {
      if (podFaultsMap.has(fault.name)) return
      podFaultsMap.set(
        fault.name,
        new FaultDetail(this, fault, {
          namespaces: this.__madison.namespace.namespaces.value,
          podList,
          namespace
        })
      )
    })
  }

  private async loadPodList(namespace: string) {
    if (this.__podListMap.has(namespace)) return
    const res = await getPodlist({ namespace })
    const data = res.data
    if (data.code === 0) {
      const list = data.data
      this.__podListMap.set(namespace, list)
    }
  }

  async deleteFault(faultId: string): Promise<boolean> {
    const res = await deleteFault({ faultId })
    const data = res.data
    if (data.code === 0) {
      this.calendarFaultsManager.refresh(true)
      return true
    }
    return false
  }

  logoutCallback(): void {}
}
