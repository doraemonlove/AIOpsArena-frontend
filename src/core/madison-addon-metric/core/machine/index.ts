import { MadisonAddon, MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import { computed, ref, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { MetricMachineDatabase, MetriMachineDataDetail } from './data'
import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { MadisonDataQueryTaskStatus, type RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { createLoopQuery, formatDate, isNumber, LRUCache } from '@/core/madison/utils'
import { NodeOrPod } from './nplist'
import { getMachinemetric, getMachinemetricData, getNodeList, getPodlist } from '../api'

export class Machine extends MadisonAddon {
  readonly MAX_INTERVAL = Math.floor(Date.now() / 1000)
  private __isCreatingQueryTask: Ref<boolean> = ref(false)
  private __type: Ref<'node' | 'pod'> = ref('node')
  private __queryType: Ref<'pod' | 'node'> = ref('node')
  private __pod: Ref<string> = ref('')
  private __queryPod: Ref<string> = ref('')
  private __node: Ref<string> = ref('')
  private __queryNode: Ref<string> = ref('')
  private __namespace: Ref<string> = ref('')
  private __queryNamespace: Ref<string> = ref('')
  private __metricName: Ref<string> = ref('')
  private __queryMetricName: Ref<string> = ref('')
  private __displayStartTime: Ref<number> = ref(0)
  private __displayEndTime: Ref<number> = ref(0)
  private __apiStartTime: Ref<number> = ref(0)
  private __apiEndTime: Ref<number> = ref(0)
  private __metricNameList: ComputedRef<string[]> = computed(() => {
    return this.__metricName.value.split(',').filter((str) => str !== '')
  })
  private __queryMetricNameList: ComputedRef<string[]> = computed(() => {
    return this.__queryMetricName.value.split(',').filter((str) => str !== '')
  })
  private __displayIdList: ComputedRef<string[]> = computed(() => {
    const namespace = this.__namespace.value
    const type = this.__type.value
    const nodeOrPod = type === 'node' ? this.__node.value : this.__pod.value
    const metricNameList = this.__metricNameList.value
    const startTime = this.__displayStartTime.value.toString()
    const endTime = this.__displayEndTime.value.toString()
    const res: string[] = []
    metricNameList.forEach((metricName) => {
      const id = `${namespace}/${type}/${nodeOrPod}/${metricName}/${startTime}/${endTime}`
      res.push(id)
    })
    return res
  })
  private __queryIdList: ComputedRef<string[]> = computed(() => {
    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const nodeOrPod = type === 'node' ? this.__queryNode.value : this.__queryPod.value
    const metricNameList = this.__queryMetricNameList.value
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()
    const res: string[] = []
    metricNameList.forEach((metricName) => {
      const id = `${namespace}/${type}/${nodeOrPod}/${metricName}/${startTime}/${endTime}`
      res.push(id)
    })
    return res
  })
  /** Map<taskId, func> */
  protected __loopStopFuncs: Map<string, () => void> = new Map()
  /** <namespace> */
  private __nodeListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()
  private __podListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()
  /** db */
  private __db: MetricMachineDatabase = new MetricMachineDatabase((key, value) => {
    /** delete callback */
    if (value.data) this.__madison.off('theme-change', value.data.themeChange)
  })

  get data(): ComputedRef<MadisonAddonDataQueryTask<MetriMachineDataDetail>[]> {
    return computed(() => {
      const idList = this.__displayIdList.value
      const res: MadisonAddonDataQueryTask<MetriMachineDataDetail>[] = []
      idList.forEach((id) => {
        const task = this.__db.get(id)
        if (task) {
          res.push(task)
        }
      })
      return res
    })
  }

  get selectedMetricName(): ComputedRef<Set<string>> {
    return computed(() => {
      return new Set(this.__metricNameList.value)
    })
  }

  get namespace(): ComputedRef<string> {
    return computed(() => this.__namespace.value)
  }

  get type(): ComputedRef<'node' | 'pod'> {
    return computed(() => this.__type.value)
  }

  get nodeOrPodList(): ComputedRef<NodeOrPod[]> {
    return computed(() => {
      const namespace = this.__namespace.value
      const type = this.__type.value
      if (type === 'node') {
        return this.__nodeListMap.get(namespace) || []
      } else {
        return this.__podListMap.get(namespace) || []
      }
    })
  }

  /** 展示数据的起始时刻 */
  get displayStartTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__apiStartTime.value * 1000))
  }
  /** 展示数据的结束时刻 */
  get displayEndTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__apiEndTime.value * 1000))
  }

  get timeRange(): WritableComputedRef<string | [Date, Date], [Date, Date]> {
    return computed({
      get: (): string | [Date, Date] => {
        if (this.__apiStartTime.value === 0 || this.__apiEndTime.value === 0) {
          return ''
        }
        return [
          this.displayStartTime.value,
          this.displayEndTime.value
        ]
      },
      set: (value: [Date, Date]) => {
        this.__apiStartTime.value = Math.floor(value[0].getTime() / 1000)
        this.__apiEndTime.value = Math.floor(value[1].getTime() / 1000)
      }
    })
  }

  get isCreatingQueryTask(): ComputedRef<boolean> {
    return computed(() => {
      return this.__isCreatingQueryTask.value
    })
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)

    madison.routerPromise.addCheck(this.checkNodeList, this)
    madison.routerPromise.addCheck(this.checkPodList, this)

    /** 销毁没有用的MetriMachineDataDetail */
    watch(
      this.data,
      (
        newVal: MadisonAddonDataQueryTask<MetriMachineDataDetail>[],
        oldVal: MadisonAddonDataQueryTask<MetriMachineDataDetail>[]
      ) => {
        const newId = new Set()
        newVal.forEach((item) => {
          newId.add(item.id)
        })
        oldVal.forEach((item) => {
          if (!newId.has(item.id) && item.data) {
            item.data.distory()
          }
        })
      }
    )
  }

  logoutCallback(): void {
    this.__db.clear()
    this.__type.value = 'node'
    this.__queryType.value = 'node'
    this.__pod.value = ''
    this.__queryPod.value = ''
    this.__node.value = ''
    this.__queryNode.value = ''
    this.__namespace.value = ''
    this.__queryNamespace.value = ''
    this.__metricName.value = ''
    this.__queryMetricName.value = ''
    this.__displayStartTime.value = 0
    this.__displayEndTime.value = 0
    this.__apiStartTime.value = 0
    this.__apiEndTime.value = 0
  }

  /**
   * check timestamp and range
   * @param to
   */
  protected checkSTANDET(to: RouteLocationNormalized): true | RouterPromiseSyncFuncRes {
    const startTimeStr = to.query.startTime
    const endTimeStr = to.query.endTime
    /** 没有参数的进入 */
    if (!startTimeStr && !endTimeStr) {
      this.__displayStartTime.value = 0
      this.__displayEndTime.value = 0
      this.__apiStartTime.value = 0
      this.__apiEndTime.value = 0
      return true
    }
    if (
      startTimeStr &&
      endTimeStr &&
      isNumber(startTimeStr as string) &&
      isNumber(endTimeStr as string)
    ) {
      const startTime = parseInt(startTimeStr as string)
      const endTime = parseInt(endTimeStr as string)
      const range = endTime - startTime
      if (startTime > Date.now() / 1000 || startTime <= 0) {
        return [
          'redirect',
          {
            name: to.name,
            query: { ...to.query, startTime: null, endTime: null },
            params: to.params
          }
        ]
      }
      if (endTime > Date.now() / 1000 || endTime <= 0) {
        return [
          'redirect',
          {
            name: to.name,
            query: { ...to.query, startTime: null, endTime: null },
            params: to.params
          }
        ]
      }
      if (range > this.MAX_INTERVAL || range < 0) {
        return [
          'redirect',
          {
            name: to.name,
            query: { ...to.query, startTime: null, endTime: null },
            params: to.params
          }
        ]
      }
      this.__apiStartTime.value = startTime
      this.__apiEndTime.value = endTime
      return true
    }
    return [
      'redirect',
      { name: to.name, query: { ...to.query, startTime: null, endTime: null }, params: to.params }
    ]
  }

  private precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (to.name !== 'metricmachine') return
    const query = to.query
    //
    // 检查namespace
    //
    const namespace = query.namespace as string
    if (!namespace) {
      return [
        'redirect',
        {
          name: 'data',
          query: {}
        }
      ]
    }
    //
    // 检查type
    //
    const ttype = query.type as string
    if (ttype !== 'node' && ttype !== 'pod') {
      return [
        'redirect',
        {
          name: 'metricmachine',
          query: { ...query, type: 'node' }
        }
      ]
    }
    const type = ttype as 'node' | 'pod'
    //
    // 分别检查其余的
    //
    if (type === 'node') {
      const node = query.node as string
      if (!node) {
        return [
          'redirect',
          {
            name: 'metric',
            query: {}
          }
        ]
      }
      this.__queryNode.value = node
    } else {
      const pod = query.pod as string
      if (!pod) {
        return [
          'redirect',
          {
            name: 'metric',
            query: {}
          }
        ]
      }
      this.__queryPod.value = pod
    }
    this.__queryType.value = type
    this.__queryNamespace.value = namespace
    //
    // 检查metricName
    //
    const metricNameStr = query.metricName as string
    const metricName = metricNameStr ? metricNameStr.split(',').map((v) => v.trim()) : []
    const setMetricName = new Set(metricName)
    const noEmptyList = Array.from(setMetricName).filter((v) => v)
    //
    // 删除重复的、删除空字符串
    //
    if (metricName.length !== noEmptyList.length) {
      return [
        'redirect',
        {
          name: 'metricmachine',
          query: {
            ...query,
            metricName: [...noEmptyList].join(',')
          }
        }
      ]
    }
    //
    // metricName是否正确在checkMachineMetric中检查
    //
    this.__queryMetricName.value = metricName.join(',')
    //
    // 检查time
    //
    const tCheck = this.checkSTANDET(to)
    if (tCheck !== true) return tCheck
    const startTime = to.query.startTime
    const endTime = to.query.endTime
    if (!startTime || !endTime) {
      return [
        'redirect',
        {
          name: 'metricmachine',
          query: {
            ...query,
            startTime: Math.floor(Date.now() / 1000) - 1 * 60 * 15,
            endTime: Math.floor(Date.now() / 1000)
          }
        }
      ]
    }
  }

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'metricmachine')
    if (!can) return
    /** 检查namespace合法性 */
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) return { name: 'data' }
    /** 检查metricName合法性 */
    await this.__madison.metric.waitingForMetricName
    const res = this.__madison.metric.hasNamespace(this.__queryNamespace.value)
    if (!res) return { name: 'data' }
    const checkRes = this.checkMachineMetricName(to, this.__queryMetricNameList.value)
    if (checkRes !== true) return checkRes
    /** 检查数据 */
    const needQuery: string[] = []
    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const nodeOrPod = type === 'node' ? this.__queryNode.value : this.__queryPod.value
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()
    this.__queryMetricNameList.value.forEach((metricName) => {
      const key = `${namespace}/${type}/${nodeOrPod}/${metricName}/${startTime}/${endTime}`
      if (!this.__db.has(key)) needQuery.push(metricName)
    })
    await this.getMetricData(needQuery)
  }

  private postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (to.name !== 'metricmachine') return
    this.__isCreatingQueryTask.value = false
    this.__type.value = this.__queryType.value
    this.__namespace.value = this.__queryNamespace.value
    this.__metricName.value = this.__queryMetricName.value
    if (this.__type.value === 'node') {
      this.__node.value = this.__queryNode.value
    } else {
      this.__pod.value = this.__queryPod.value
    }
    this.__displayStartTime.value = this.__apiStartTime.value
    this.__displayEndTime.value = this.__apiEndTime.value
  }

  /**
   * 检查查询的metricName是否正确
   * @param to
   * @param metricName
   * @returns
   */
  private checkMachineMetricName(
    to: RouteLocationNormalized,
    metricName: string[]
  ): RouteLocationRaw | true {
    const checkerF = this.__madison.metric.getMetricName(this.__queryNamespace.value)
    if (!checkerF) {
      return {
        name: 'metric',
        query: {}
      }
    }
    const checker = checkerF.machine[this.__queryType.value]
    const checkedMetricName: string[] = []
    metricName.forEach((name) => {
      if (checker.has(name)) checkedMetricName.push(name)
    })
    if (checkedMetricName.length !== metricName.length) {
      return {
        name: 'metricmachine',
        query: {
          ...to.query,
          metricName: checkedMetricName.join(',')
        }
      }
    }
    return true
  }

  /**
   * 查询这些metricName的数据
   * @param manager
   * @param metricName
   */
  private async getMetricData(metricNameList: string[]) {
    this.__isCreatingQueryTask.value = true
    const asyncList: Promise<void>[] = []
    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const nodeOrPod = type === 'node' ? this.__queryNode.value : this.__queryPod.value
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()
    metricNameList.forEach((metricName) => {
      const key = `${namespace}/${type}/${nodeOrPod}/${metricName}/${startTime}/${endTime}`
      /** 创建查询任务 */
      const task = new MadisonAddonDataQueryTask<MetriMachineDataDetail>(
        key,
        {
          name: 'metric',
          query: {}
        },
        `
            <p class="text-[12px]">
            namespace: ${namespace}<br/>
            startTime: ${formatDate(new Date(this.__apiStartTime.value * 1000))}<br/>
            endTime: ${formatDate(new Date(this.__apiEndTime.value * 1000))}<br/>
            </p>
            `,
        (route) => true
      )
      this.__db.set(key, task)
      const func = async () => {
        const res = await getMachinemetric({
          namespace: this.__queryNamespace.value,
          metricName: metricName,
          startTime: this.__apiStartTime.value,
          endTime: this.__apiEndTime.value,
          metricType: this.__queryType.value,
          node: this.__queryNode.value,
          pod: this.__queryPod.value
        })
        const data = res.data
        if (data.code !== 0) return
        const taskId = data.data.task_id
        const { stop } = createLoopQuery(
          { taskId },
          getMachinemetricData,
          (res) => {
            if (res.data.status === 'SUCCESS') return true
            if (res.data.status === 'FAILURE') return true
            return false
          },
          (res) => {
            this.__loopStopFuncs.delete(key)
            const status = res.data.status
            const result = res.data.result
            const task = this.__db.get(key)
            if (task === undefined) return
            if (result !== null || result !== undefined) {
              const detail = new MetriMachineDataDetail(
                result,
                key,
                this.__madison.theme.theme.value,
                metricName
              )
              this.__madison.on('theme-change', detail.themeChange)
              task.data = detail
            }
            task.quering = false
            if (status === 'SUCCESS') task.status = MadisonDataQueryTaskStatus.SUCCESS
            else task.status = MadisonDataQueryTaskStatus.ERROR
          },
          () => {
            const task = this.__db.get(key)
            if (task === undefined) return
            task.status = MadisonDataQueryTaskStatus.ERROR
          },
          () => {}
        )
        this.__loopStopFuncs.set(key, stop)
      }
      asyncList.push(func())
    })
    await Promise.all(asyncList)
  }

  async checkPodList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'metricmachine')
    if (!can) return
    if (this.__queryType.value === 'node') return
    /** 检查namespace合法性 */
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) return
    const namespace = this.__queryNamespace.value
    if (this.__podListMap.has(namespace)) return

    const listData = await getPodlist({ namespace })
    const data = listData.data
    if (data.code === 0) {
      const list = data.data.map((name) => new NodeOrPod(name, 'pod'))
      this.__podListMap.set(namespace, list)
    }
  }

  async checkNodeList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'metricmachine')
    if (!can) return
    if (this.__queryType.value === 'pod') return
    /** 检查namespace合法性 */
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) return
    const namespace = this.__queryNamespace.value
    if (this.__nodeListMap.has(namespace)) return

    const listData = await getNodeList({ namespace })
    const data = listData.data
    if (data.code === 0) {
      const list = data.data.map((name) => new NodeOrPod(name, 'node'))
      this.__nodeListMap.set(namespace, list)
    }
  }

  createQueryTask() {
    this.__madison.routerPromise.router.push({
      name: 'metricmachine',
      query: {
        namespace: this.__queryNamespace.value,
        startTime: this.__apiStartTime.value,
        endTime: this.__apiEndTime.value,
        metricName: this.__queryMetricName.value === '' ? null : this.__queryMetricName.value,
        type: this.__type.value,
        [this.__type.value]: this.__type.value === 'node' ? this.__queryNode.value : this.__queryPod.value
      }
    })
  }
}
