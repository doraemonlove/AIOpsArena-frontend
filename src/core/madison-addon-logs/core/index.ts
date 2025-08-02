import { MadisonAddonDataQueryTask, MadisonAddonDataTMR2T } from '@/core/madison/core/addon-base'
import { MadisonDataQueryTaskStatus, type RouterPromiseSyncFuncRes } from '@/core/madison/types'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { computed, reactive, type Reactive } from 'vue'
import type { Madison } from '@/core/madison/core'
import type { LogsOptions } from '../types'
import { getLogs, getLogsData } from './api'
import { createLoopQuery, formatDate } from '@/core/madison/utils'
import { FullLogs } from './logs'

export class Logs extends MadisonAddonDataTMR2T<FullLogs[]> {
  protected stepTimeList: [number, string][] = [
    [1 * 1, '1s'],
    [1 * 10, '10s'],
    [1 * 15, '15s'],
    [1 * 30, '30s'],
    [1 * 60, '1m'],
    [1 * 60 * 5, '5m'],
    [1 * 60 * 15, '15m']
  ]
  readonly MAX_INTERVAL = 1 * 60 * 15

  /** Map<namespace-startTime-endTime, MadisonAddonDataQueryTask<FullTrace[]>> */
  private __logsFullData: Reactive<Map<string, MadisonAddonDataQueryTask<FullLogs[]>>> = reactive(
    new Map()
  )
  /** Map<namespace, Map<namespace-startTime-endTime, MadisonAddonDataQueryTask<FullTrace[]>>> */
  private __logsNamespaceMapData: Reactive<
      Map<string, Map<string, MadisonAddonDataQueryTask<FullLogs[]>>>
    > = reactive(new Map())

  protected __displayId = computed(() => {
    return `${this.__madison.namespace.queryNamespace.value}-${this.__displayStartTime.value}-${this.__displayEndTime.value}`
  })

  get data() {
    return computed(() => {
      const data = this.__logsFullData.get(this.__displayId.value)
      if (data === undefined) return null
      return data
    })
  }

  get queryTaskList() {
    return computed(() => {
      const namespace = this.__madison.namespace.queryNamespace.value
      const datas = this.__logsNamespaceMapData.get(namespace)
      if (datas === undefined) return []
      return Array.from(datas.values())
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
    this.__logsFullData.clear()
    this.__logsNamespaceMapData.clear()
  }

  precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (!this.is(to, 'logs')) return
    const preC = this.checkTSANDRI(to)
    if (preC !== true) return preC
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'logs')
    if (!can) return
    const hn = this.hasNamespace(to)
    /** namespace不存在，检查是否有可用的namespace */
    if (!hn) {
      await this.__madison.namespace.waitingForNamespaceGet
      const tn = this.__madison.namespace.namespaces.value[0]
      /** 无可用namespace，跳转到data */
      if (tn === undefined) return { name: 'data' }
      /** 有可用，加上namespace */
      return { name: 'logs', query: { ...to.query, namespace: tn }}
    }
    /** 有上面的判断，进入logs页面的查询参数肯定会有namespace（不会是空） */
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValidRef
    /** 如果namespace非法，则跳转到data */
    if (!nv) return { name: 'data' }
    const namespace = this.__madison.namespace.queryQueryNamespace.value
    /** 查询参数的默认状态则不进行查询，此时查询参数应该只有namespace */
    if (this.queryIsDef()) return
    const key = `${namespace}-${this.__apiStartTime.value}-${this.__apiEndTime.value}`
    if (this.__logsFullData.has(key)) return
    /** 查询任务不存在，创建查询任务 */
    const tTimestamp = this.__timestamp.value
    const tRange = this.rangeStr.value
    const task = new MadisonAddonDataQueryTask<FullLogs[]>(
      key,
      {
        name: 'logs',
        query: {
          namespace: namespace,
          timestamp: this.__timestamp.value,
          range: this.rangeStr.value
        }
      },
      `
      <p class="text-[12px]">
      namespace: ${namespace}<br/>
      startTime: ${formatDate(new Date(this.__apiStartTime.value * 1000))}<br/>
      endTime: ${formatDate(new Date(this.__apiEndTime.value * 1000))}<br/>
      </p>
      `,
      (route) =>
        route.query.namespace === namespace &&
        route.query.range === tRange &&
        route.query.timestamp === tTimestamp.toString()
    )
    this.__logsFullData.set(key, task)
    if (!this.__logsNamespaceMapData.has(namespace)) this.__logsNamespaceMapData.set(namespace, new Map())
    this.__logsNamespaceMapData.get(namespace)!.set(key, task)
    await this.queryLogs({
      startTime: this.__apiStartTime.value,
      endTime: this.__apiEndTime.value,
      namespace: namespace
    })
  }

  private async queryLogs(options: LogsOptions) {
    this.__isCreatingQueryTask.value = true
    const key = `${options.namespace}-${options.startTime}-${options.endTime}`
    const res = await getLogs(options)
    const data = res.data
    if (data.code === 1) {
      const task = this.__logsFullData.get(key)
      if (task === undefined) return
      task.quering = false
      task.status = MadisonDataQueryTaskStatus.ERROR
      return
    }
    const taskId = data.data.task_id
    const { stop } = createLoopQuery(
      { taskId },
      getLogsData,
      (res) => {
        if (res.data.status === 'SUCCESS') return true
        if (res.data.status === 'FAILURE') return true
        return false
      },
      (res) => {
        this.__loopStopFuncs.delete(key)
        const status = res.data.status
        const result = res.data.result
        const task = this.__logsFullData.get(key)
        if (task === undefined) return
        if (result !== null || result !== undefined) { task.data = result.map((item) => new FullLogs(item)) }
        task.quering = false
        if (status === 'SUCCESS') task.status = MadisonDataQueryTaskStatus.SUCCESS
        else task.status = MadisonDataQueryTaskStatus.ERROR
      },
      () => {
        const task = this.__logsFullData.get(key)
        if (task === undefined) return
        task.status = MadisonDataQueryTaskStatus.ERROR
      },
      () => {}
    )
    this.__loopStopFuncs.set(key, stop)
  }

  postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'logs') return
    this.__isCreatingQueryTask.value = false
    if (this.queryIsDef()) {
      this.__displayStartTime.value = 0
      this.__displayEndTime.value = 0
    } else {
      this.__displayStartTime.value = this.__apiStartTime.value
      this.__displayEndTime.value = this.__apiEndTime.value
    }
  }

  /**
   * 在选择好namespace等数据之后直接调用函数
   */
  createQueryTask() {
    this.__madison.routerPromise.router.push({
      name: 'logs',
      query: {
        timestamp: this.__timestamp.value,
        range: this.rangeStr.value,
        namespace: this.__madison.namespace.queryNamespace.value
      }
    })
  }

  /**
   * 移除查询任务
   * @param taskId 查询任务id
   */
  removeTask(taskId: string): boolean {
    const stop = this.__loopStopFuncs.get(taskId)
    if (stop) stop()
    const namespace = taskId.slice(0, this.findSecondLastDashIndex(taskId))
    let res = this.__logsFullData.delete(taskId)
    const map = this.__logsNamespaceMapData.get(namespace)
    if (map === undefined) return false
    res = map.delete(taskId) && res
    if (res) {
      this.__madison.routerPromise.router.push({
        name: 'logs',
        query: {
          namespace: this.__madison.namespace.queryNamespace.value
        }
      })
    }
    return res
  }
}
