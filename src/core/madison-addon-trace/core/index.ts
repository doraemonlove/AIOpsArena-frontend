import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Madison } from '@/core/madison/core'
import { getTrace } from './api'
import { LRUCache } from '@/core/madison/utils'
import { TraceDetail } from './trace'

export class Trace extends MadisonAddon {
  private __traceCache: LRUCache<string, TraceDetail> = new LRUCache(30)

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.checkTrace, this)
  }

  logoutCallback(): void {}

  async checkTrace(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (to.name === 'login' || to.name === 'register') return
    if (to.name !== 'trace') return
    //
    // 已经登录并且没有获取数据
    //
    await this.__madison.login.waitingForLogin
    const id = to.params.id as string
    await this.queryTrace(id)
  }

  private async queryTrace(traceId: string): Promise<boolean> {
    if (this.__traceCache.has(traceId)) return true
    const res = await getTrace(traceId)
    const data = res.data
    if (data.code === 1 || data.data.length === 0) return false
    this.__traceCache.set(traceId, new TraceDetail(data.data, ''))
    return true
  }

  /**
   * 获取一个TraceDetail实例，不存在则说明traceId错误
   * @param traceId traceId
   * @returns
   */
  getTrace(traceId: string): TraceDetail | undefined {
    return this.__traceCache.get(traceId)
  }
}
