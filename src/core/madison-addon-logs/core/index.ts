import { MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'
import { MadisonDataLoaderStatus, type RouterPromiseSyncFuncRes } from '@/core/madison/types'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { computed, reactive, type ComputedRef } from 'vue'
import type { Madison } from '@/core/madison/core'
import type { LogsOptions } from '../types'
import { getLogs, queryLogs } from './api'
import { LRUCache } from '@/core/madison/utils'
import { FullLogs } from './logs'
import {
  MadisonAddonDataTimestamp2Range,
  MadisonAddonDataTimestamp2RangeLoader
} from '@/core/madison/core/addon-base/data-base'

export class LogLoader extends MadisonAddonDataTimestamp2RangeLoader<FullLogs[]> {
  load(): void {
    this.status = MadisonDataLoaderStatus.LOADING
    const func = async () => {
      if (this.status === MadisonDataLoaderStatus.DISTORY) return
      const res = await getLogs(this.taskId)
      const data = res.data
      if (data.code === 0) {
        if (data.data.status === 'SUCCESS') {
          this.data = data.data.result.map(item => new FullLogs(item))
          this.status = MadisonDataLoaderStatus.SUCCESS
          return
        }
        if (data.data.status === 'FAILURE') {
          this.status = MadisonDataLoaderStatus.ERROR
          return
        }
        setTimeout(func, 500)
      }
    }
    func()
  }

  show(): void {
    const router = this.useRouter()
    router.push({
      name: 'logs',
      query: {
        namespace: this.namespace,
        timestamp: Math.floor(this.timestamp.getTime() / 1000),
        range: this.range
      }
    })
  }

  distory(): void {
    this.status = MadisonDataLoaderStatus.DISTORY
  }
}

export class Logs extends MadisonAddonDataTimestamp2Range<FullLogs[]> {
  protected stepTimeList: [number, string][] = [
    [1 * 1, '1s'],
    [1 * 10, '10s'],
    [1 * 15, '15s'],
    [1 * 30, '30s'],
    [1 * 60, '1m']
  ]
  readonly MAX_INTERVAL = 1 * 60 * 5

  protected __data = reactive(
    new LRUCache<string, LogLoader>(20)
  )

  get data(): ComputedRef<LogLoader | null> {
    return computed(() => {
      if (this.__currentId.value === null) return null
      const loader = this.__data.get(this.__currentId.value)
      if (loader === undefined) return null
      return loader
    })
  }

  get dataList(): ComputedRef<LogLoader[]> {
    return computed(() => {
      return Array.from(this.__data.values())
    })
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  clearId() {
    this.__currentId.value = null
  }

  removeLoader(taskId: string): boolean {
    return this.__data.delete(taskId)
  }

  logoutCallback(): void {
    super.logoutCallback()
  }

  precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'logs') return
    const preC = this.checkTSANDRI(to)
    if (preC !== true) return preC
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defQNSCheck(to, from, 'logs')
    if (!can) return
    if (this.__apiUseStartTime.value === 0 || this.__apiUseEndTime.value === 0) {
      return
    }
    const key = `${this.__apiUseStartTime.value}-${this.__apiUseEndTime.value}-${this.__madison.namespace.queryQueryNamespace.value}`
    if (this.__data.has(key)) return
    const res = await queryLogs({
      startTime: this.__apiUseStartTime.value,
      endTime: this.__apiUseEndTime.value,
      namespace: this.__madison.namespace.queryParamNamespace.value
    })
    const data = res.data
    if (data.code === 0) {
      this.__currentId.value = key
      const loader = new LogLoader(
        key,
        data.data.task_id,
        this.__madison.namespace.queryQueryNamespace.value,
        () => this.__madison.routerPromise.router,
        new Date(this.timestamp.value),
        this.rangeStr.value,
        'sss'
      )
      this.__data.set(key, loader)
    }
  }

  postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'logs') return
  }

  /**
   * 在选择好namespace等数据之后直接调用函数
   */
  query() {
    this.__madison.routerPromise.router.push({
      name: 'logs',
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
