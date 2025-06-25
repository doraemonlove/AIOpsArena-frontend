import { MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import type { Madison } from '@/core/madison/core'
import type { TracesOptions } from '../types'
import { getTraces } from './api'
import { LRUCache } from '@/core/madison/utils'
import { FullTrace } from './traces'

export class Traces extends MadisonAddonDataTMR2T<FullTrace> {
  /**
   * 最大间隔15分钟
   */
  readonly MAX_INTERVAL: number = 1 * 60 * 15
  protected stepTimeList: [number, string][] = [
    [1 * 1, '1s'],
    [1 * 10, '10s'],
    [1 * 15, '15s'],
    [1 * 30, '30s'],
    [1 * 60, '1m'],
    [1 * 60 * 5, '5m'],
    [1 * 60 * 15, '15m']
  ]
  private __tracesCache: LRUCache<string, FullTrace[]> = new LRUCache(10)
  private __dataId = computed(() => {
    return `${this.__startTime.value}-${this.__endTime.value}-${this.__madison.namespace.paramNamespace.value}`
  })

  get data() {
    return computed(() => {
      return this.__tracesCache.get(this.__dataId.value) ?? []
    })
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  logoutCallback(): void {
    super.logoutCallback()
    this.__tracesCache.clear()
  }

  precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (to.name !== 'traces') return
    const preC = this.checkTSANDRI(to)
    if (preC !== true) return preC
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defPNSCheck(to, from, 'traces')
    if (!can) return
    if (this.__apiUseStartTime.value === 0 || this.__apiUseEndTime.value === 0) {
      return
    }
    const key = `${this.__apiUseStartTime.value}-${this.__apiUseEndTime.value}-${this.__madison.namespace.queryParamNamespace.value}`
    if (this.__tracesCache.has(key)) return
    await this.queryTraces({
      startTime: this.__apiUseStartTime.value,
      endTime: this.__apiUseEndTime.value,
      namespace: this.__madison.namespace.queryParamNamespace.value
    })
  }

  postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    this.__startTime.value = this.__apiUseStartTime.value
    this.__endTime.value = this.__apiUseEndTime.value
  }

  private async queryTraces(options: TracesOptions) {
    this.__searching.value = true
    const key = `${options.startTime}-${options.endTime}-${options.namespace}`
    const res = await getTraces(options)
    const data = res.data
    const list: FullTrace[] = []
    data.data.forEach((item) => {
      list.push(new FullTrace(item))
    })
    this.__tracesCache.set(key, list)
    this.__searching.value = false
  }

  /**
   * 在选择好namespace等数据之后直接调用函数
   */
  query() {
    this.__madison.routerPromise.router.push({
      name: 'traces',
      query: {
        timestamp: this.__timestamp.value,
        range: this.rangeStr.value
      },
      params: {
        namespace: this.__madison.namespace.paramNamespace.value
      }
    })
  }
}
