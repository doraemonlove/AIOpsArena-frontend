import { MadisonAddon, MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Madison } from '@/core/madison/core'
import { getTrace, getTraceData } from './api'
import { createLoopQuery } from '@/core/madison/utils'
import { TraceDetail } from './trace'
import { MadisonDataQueryTaskStatus, type RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { computed, reactive, ref, type Reactive, type Ref } from 'vue'

export class Trace extends MadisonAddon {
  private __traceFullData: Reactive<Map<string, MadisonAddonDataQueryTask<TraceDetail>>> = reactive(
    new Map()
  )
  /** Map<taskId, func> */
  protected __loopStopFuncs: Map<string, () => void> = new Map()
  protected __displayId: Ref<string> = ref('')
  protected __apiId: Ref<string> = ref('')

  get data() {
    return computed(() => {
      const data = this.__traceFullData.get(this.__displayId.value)
      if (data === undefined) return null
      return data
    })
  }

  get queryTaskList() {
    return computed(() => {
      return Array.from(this.__traceFullData.values())
    })
  }

  get searchId() {
    return computed({
      get: () => {
        return this.__apiId.value
      },
      set: (value: string) => {
        this.__apiId.value = value
      }
    })
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  logoutCallback(): void {
    this.__traceFullData.clear()
    this.__loopStopFuncs.clear()
    this.__displayId.value = ''
    this.__apiId.value = ''
  }

  precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'trace') return
    const id = to.params.id as string
    if (id === undefined) {
      return ['redirect', { name: 'tracesearch' }]
    }
    this.__apiId.value = id
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'trace')
    if (!can) return
    const id = this.__apiId.value
    if (id === '' || this.__traceFullData.has(id)) return
    const task = new MadisonAddonDataQueryTask<TraceDetail>(
      id,
      {
        name: 'trace',
        params: {
          id
        }
      },
      `ID: ${id}`,
      (route) => route.params.id === id
    )
    this.__traceFullData.set(id, task)
    await this.queryTrace(id)
  }

  postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'trace') {
      this.__displayId.value = ''
      return
    }
    this.__displayId.value = this.__apiId.value
    this.__apiId.value = ''
  }

  private async queryTrace(traceId: string) {
    const res = await getTrace(traceId)
    const data = res.data
    if (data.code === 1) {
      const task = this.__traceFullData.get(traceId)
      if (task === undefined) return
      task.quering = false
      task.status = MadisonDataQueryTaskStatus.ERROR
      return
    }
    const { stop } = createLoopQuery(
      { taskId: res.data.data.task_id },
      getTraceData,
      (res) => {
        const task = this.__traceFullData.get(traceId)
        if (task !== undefined) {
          task.status = MadisonDataQueryTaskStatus.LOADING
        }
        if (res.data.status === 'SUCCESS') return true
        if (res.data.status === 'FAILURE') return true
        return false
      },
      (res) => {
        this.__loopStopFuncs.delete(traceId)
        const status = res.data.status
        const result = res.data.result
        const task = this.__traceFullData.get(traceId)
        if (task === undefined) return
        if (result !== null || result !== undefined) {
          task.data = new TraceDetail(result, '')
        }
        task.quering = false
        if (status === 'SUCCESS') task.status = MadisonDataQueryTaskStatus.SUCCESS
        else task.status = MadisonDataQueryTaskStatus.ERROR
      },
      () => {
        const task = this.__traceFullData.get(traceId)
        if (task === undefined) return
        task.status = MadisonDataQueryTaskStatus.ERROR
      },
      () => {}
    )
    this.__loopStopFuncs.set(traceId, stop)
  }

  /**
   * 在填好需要查询的id后直接调用函数
   */
  createQueryTask() {
    this.__madison.routerPromise.router.push({
      name: 'trace',
      params: {
        id: this.__apiId.value
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
    const res = this.__traceFullData.delete(taskId)
    if (res) {
      this.__madison.routerPromise.router.push({
        name: 'tracesearch'
      })
    }
    return res
  }
}
