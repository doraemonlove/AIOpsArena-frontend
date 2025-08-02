import type { RouteLocationNormalized, RouteLocationNormalizedLoadedGeneric, RouteLocationRaw } from 'vue-router'
import type { Madison } from '..'
import { MadisonDataQueryTaskStatus, type RouterPromiseSyncFuncRes } from '../../types'
import { computed, ref, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { debounce, isNumber, message, parseTimeToSeconds } from '../../utils'

export abstract class MadisonAddon {
  protected readonly __madison: Madison

  constructor(madison: Madison) {
    this.__madison = madison

    madison.on('logout', this.logoutCallback, this)
  }

  abstract logoutCallback(): void

  messageI18n(msgKey: string, type?: 'error' | 'success' | 'info' | 'warning', duration?: number) {
    msgKey = 'Madison.' + msgKey
    const t = this.__madison.i18n.getT()
    const msg = t(msgKey)
    message(msg, type, duration)
  }

  /**
   * #### 数据预检查
   * - true则代表检查通过，继续执行
   * - false则代表检查不通过，直接退出
   * #### 检查内容
   * - 是否是需要检查的页面
   * - 是否登录，登录是否成功（由login判断）
   * - 路径namespace是否正确（由dataset判断）
   *
   * @param to
   * @param from
   * @param check string: to.name === string | DefCheckFunc: true则认为是匹配的页面
   * @returns
   */
  async defPNSCheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    check: string | DefCheckFunc,
    noMsg: boolean = true
  ): Promise<boolean> {
    const res = await this.defNoNSCheck(to, from, check)
    if (!res) return false
    //
    // 等待namespace检测
    //
    await this.__madison.namespace.waitingForParamNamespaceCheck
    //
    // 是否正确
    //
    if (!this.__madison.namespace.paramNamespaceIsValid) {
      if (!noMsg) message('Namespace is not correct')
      return false
    }
    return true
  }

  /**
   * #### 数据预检查
   * - true则代表检查通过，继续执行
   * - false则代表检查不通过，直接退出
   * #### 检查内容
   * - 是否是需要检查的页面
   * - 是否登录，登录是否成功（由login判断）
   * - 查询namespace是否正确（由dataset判断）
   *
   * @param to
   * @param from
   * @param check string: to.name === string | DefCheckFunc: true则认为是匹配的页面
   * @returns
   */
  async defQNSCheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    check: string | DefCheckFunc,
    noMsg: boolean = true
  ): Promise<boolean> {
    const res = await this.defNoNSCheck(to, from, check)
    if (!res) return false
    //
    // 等待namespace检测
    //
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    //
    // 是否正确
    //
    if (!this.__madison.namespace.queryNamespaceIsValid) {
      if (!noMsg) message('Namespace is not correct')
      return false
    }
    return true
  }

  /**
   * 检查路径和登录情况，不进行namespace检查
   *
   * @param to
   * @param from
   * @param check
   * @returns
   */
  async defNoNSCheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    check: string | DefCheckFunc | true
  ): Promise<boolean> {
    if (to.name === 'login' || to.name === 'register' || to.name === 'retrieve') return false
    //
    // 是否是匹配的页面
    //
    if (typeof check === 'string') {
      if (to.name !== check) return false
    } else if (check === true) {
      // no check
    } else {
      if (!check(to)) return false
    }
    //
    // 等待登录
    //
    await this.__madison.login.waitingForLogin
    //
    // 是否登录
    //
    if (!this.__madison.login.logged.value) return false
    return true
  }

  /**
   * 去往的页面的name是否是输入的name
   * @param to RouteLocationNormalized
   * @param name string
   * @returns boolean
   */
  is(to: RouteLocationNormalized, name: string): boolean {
    return to.name === name
  }

  /**
   * 去往的页面的路由是否包含输入的name
   * @param to RouteLocationNormalized
   * @param name string
   * @returns boolean
   */
  includes(to: RouteLocationNormalized, name: string): boolean {
    return to.matched.find(item => item.name === name) !== undefined
  }

  protected findSecondLastDashIndex(str: string): number {
    let lastDashIndex = -1
    let secondLastDashIndex = -1

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '-') {
        secondLastDashIndex = lastDashIndex
        lastDashIndex = i
      }
    }

    return secondLastDashIndex
  }
}

type DefCheckFunc = (to: RouteLocationNormalized) => boolean

/**
 * #### 时间
 * 1. 所有变量的时间单位都是s
 * 2. 路由的时间单位是s
 * #### 数据处理
 * 1. 设置数据之后(此时__queryXXX数据已经改变)，调用query方法，实现路由跳转
 * 2. precheck方法中，从路由中获取查询参数，进行检查，赋值给__queryXXX(即使是通过调用query方法进入的)
 * 3. check方法中，根据__queryXXX数据进行数据查询
 * 4. postcheck方法中，将__queryXXX数据赋值给__XXX进行页面数据更新(only for stoe)
 */
export abstract class MadisonAddonDataBase<DATA> extends MadisonAddon {
  readonly MAX_INTERVAL = Date.now()
  /** for all, 展示的查询任务的起始时刻 */
  protected __displayStartTime: Ref<number> = ref(0)
  /** for all, 展示的查询任务的结束时刻 */
  protected __displayEndTime: Ref<number> = ref(0)
  /** for all */
  protected __isCreatingQueryTask: Ref<boolean> = ref(false)
  /** for all, 展示的查询任务的id */
  protected abstract __displayId: ComputedRef<string>
  /** for all, for api search */
  protected abstract __apiStartTime: Ref<number> | WritableComputedRef<number, number>
  /** for all, for api search */
  protected abstract __apiEndTime: Ref<number> | WritableComputedRef<number, number>
  /** Map<taskId, func> */
  protected __loopStopFuncs: Map<string, () => void> = new Map()
  /** 是否正在创建查询任务 */
  get isCreatingQueryTask(): ComputedRef<boolean> {
    return computed(() => this.__isCreatingQueryTask.value)
  }
  /** 展示数据的起始时刻 */
  get displayStartTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__displayStartTime.value * 1000))
  }
  /** 展示数据的结束时刻 */
  get displayEndTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__displayEndTime.value * 1000))
  }
  /** 展示的数据 */
  abstract get data(): ComputedRef<MadisonAddonDataQueryTask<DATA> | null>
  /** 查询任务列表 */
  abstract get queryTaskList(): ComputedRef<MadisonAddonDataQueryTask<DATA>[]>

  abstract precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes
  abstract check(to: RouteLocationNormalized, from: RouteLocationNormalized): Promise<RouteLocationRaw | void>
  abstract postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes

  logoutCallback(): void {
    this.__loopStopFuncs.forEach((func) => func())
    this.__loopStopFuncs.clear()
    this.__isCreatingQueryTask.value = false
    this.__displayStartTime.value = 0
    this.__displayEndTime.value = 0
  }

  /**
   * 修改完数据后调用此函数进行**路由跳转**创建查询任务
   *
   * 具体查询数据函数应该挂载到routerPromise.check中
   */
  abstract createQueryTask(): void

  /**
   * 移除查询任务
   * @param taskId 查询任务id
   */
  abstract removeTask(taskId: string): boolean

  /**
   * 查询是否是默认状态
   */
  abstract queryIsDef(): boolean

  /**
   * 查询参数中是否包含namespace
   * @param to RouteLocationNormalized
   * @returns boolean
   */
  hasNamespace(to: RouteLocationNormalized): boolean {
    return to.query.namespace !== undefined && to.query.namespace !== ''
  }
}

export abstract class MadisonAddonDataS2E<DATA> extends MadisonAddonDataBase<DATA> {
  protected __apiStartTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)
  protected __apiEndTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)

  get timeRange(): WritableComputedRef<string | [Date, Date], [Date, Date]> {
    return computed({
      get: (): string | [Date, Date] => {
        if (this.__displayStartTime.value === 0 || this.__displayEndTime.value === 0) {
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

  logoutCallback(): void {
    super.logoutCallback()
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
      return true
    }
    if (startTimeStr && endTimeStr && isNumber(startTimeStr as string) && isNumber(endTimeStr as string)) {
      const startTime = parseInt(startTimeStr as string)
      const endTime = parseInt(endTimeStr as string)
      const range = endTime - startTime
      if (startTime > Date.now() / 1000 || startTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, startTime: null, endTime: null }, params: to.params }]
      }
      if (endTime > Date.now() / 1000 || endTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, startTime: null, endTime: null }, params: to.params }]
      }
      if (range > this.MAX_INTERVAL || range < 0) {
        return ['redirect', { name: to.name, query: { ...to.query, startTime: null, endTime: null }, params: to.params }]
      }
      this.__apiStartTime.value = startTime
      this.__apiEndTime.value = endTime
      return true
    }
    return ['redirect', { name: to.name, query: { ...to.query, startTime: null, endTime: null }, params: to.params }]
  }

  queryIsDef(): boolean {
    return this.__apiStartTime.value === 0 || this.__apiEndTime.value === 0
  }
}

export abstract class MadisonAddonDataTMR2T<DATA> extends MadisonAddonDataBase<DATA> {
  readonly TER2TType: 'now' | 'query'
  protected stepTimeList: [number, string][] = [
    [1 * 1, '1s'],
    [1 * 10, '10s'],
    [1 * 15, '15s'],
    [1 * 30, '30s'],
    [1 * 60, '1m'],
    [1 * 60 * 5, '5m'],
    [1 * 60 * 15, '15m'],
    [1 * 60 * 30, '30m'],
    [1 * 60 * 60, '1h'],
    [1 * 60 * 60 * 2, '2h'],
    [1 * 60 * 60 * 6, '6h'],
    [1 * 60 * 60 * 12, '12h'],
    [1 * 60 * 60 * 24, '1d'],
    [1 * 60 * 60 * 24 * 2, '2d']
  ]
  protected __selectedRangeIndex: Ref<number> = ref(0)
  protected __timestamp: Ref<number> = ref(0)
  protected __inputRangeStr: Ref<string> = ref('')

  protected __apiStartTime: Ref<number, number> | WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__timestamp.value - parseTimeToSeconds(this.rangeStr.value)
    },
    set: (val) => {
      throw new Error('can not set apiUseStartTime')
    }
  })

  protected __apiEndTime: Ref<number, number> | WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__timestamp.value
    },
    set: (val) => {
      throw new Error('can not set apiUseEndTime')
    }
  })

  /**
   * for input
   */
  get rangeStr(): WritableComputedRef<string, string> {
    return computed({
      get: () => {
        return this.__inputRangeStr.value ? this.__inputRangeStr.value : this.stepTimeList[this.__selectedRangeIndex.value][1]
      },
      set: (value: string) => {
        this.__inputRangeStr.value = value
      }
    })
  }

  get hasPrevStep(): ComputedRef<boolean> {
    return computed(() => this.__selectedRangeIndex.value > 0)
  }

  get hasNextStep(): ComputedRef<boolean>  {
    return computed(
      () => this.__selectedRangeIndex.value < this.stepTimeList.length - 1
    )
  }

  get timestamp(): WritableComputedRef<Date | string, Date> {
    return computed({
      get: () => {
        return this.__timestamp.value > 0 ? new Date(this.__timestamp.value * 1000) : ''
      },
      set: (value: Date) => {
        this.__timestamp.value = Math.floor(value.getTime() / 1000)
        if (this.TER2TType === 'now') this.debouncedChangeRangeDataTimestamp(this.__timestamp.value)
      }
    })
  }

  get rangeIndex(): WritableComputedRef<number> {
    return computed({
      get: () => {
        return this.__selectedRangeIndex.value
      },
      set: (value: number) => {
        this.__selectedRangeIndex.value = value
        if (this.TER2TType === 'now') this.debouncedChangeRangeDataRangeIndex(value)
      }
    })
  }

  protected debouncedChangeRangeDataTimestamp = debounce(this.changeRangeData('timestamp'), 200)
  protected debouncedChangeRangeDataRangeIndex = debounce(this.changeRangeData('range'), 200)

  constructor(madison: Madison, type: 'now' | 'query' = 'query') {
    super(madison)

    watch(this.__selectedRangeIndex, () => {
      this.__inputRangeStr.value = ''
    })

    this.TER2TType = type
  }

  logoutCallback(): void {
    super.logoutCallback()
    this.__inputRangeStr.value = ''
    this.__selectedRangeIndex.value = 0
    this.__timestamp.value = 0
  }

  protected changeRangeData(key: string) {
    return (value: number | string) => {
      const route = this.__madison.routerPromise.router.currentRoute.value
      this.__madison.routerPromise.router.push({
        name: route.name,
        query: { ...route.query, [key]: value }
      })
    }
  }

  /**
   * check timestamp and range
   * @param to
   */
  protected checkTSANDRI(to: RouteLocationNormalized): true | RouterPromiseSyncFuncRes {
    const timestampStr = to.query.timestamp
    const rangeStr = to.query.range
    /** 没有参数的进入 */
    if (!timestampStr && !rangeStr) {
      this.__timestamp.value = 0
      this.__selectedRangeIndex.value = 0
      this.__inputRangeStr.value = ''
      this.__displayStartTime.value = 0
      this.__displayEndTime.value = 0
      return true
    }
    if (timestampStr && rangeStr && isNumber([timestampStr as string])) {
      const timestamp = parseInt(timestampStr as string)
      const range = parseTimeToSeconds(rangeStr as string)
      if (timestamp > Date.now() / 1000 || timestamp <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, timestamp: undefined, range: undefined }, params: to.params }]
      }
      if (range < 0 || timestamp - range < 0) {
        this.__inputRangeStr.value = ''
        return ['redirect', { name: to.name, query: { ...to.query, timestamp: undefined, range: undefined }, params: to.params }]
      }
      this.__timestamp.value = timestamp
      const index = this.stepTimeList.findIndex((item) => item[1] === rangeStr)
      if (index > -1) {
        this.__selectedRangeIndex.value = index
        this.__inputRangeStr.value = ''
      } else {
        this.rangeStr.value = rangeStr as string
      }
      if (this.__apiEndTime.value - this.__apiStartTime.value > this.MAX_INTERVAL) return ['redirect', { name: to.name, query: { ...to.query, timestamp: undefined, range: undefined }, params: to.params }]
      return true
    }
    return ['redirect', { name: to.name, query: { ...to.query, timestamp: undefined, range: undefined }, params: to.params }]
  }

  queryIsDef(): boolean {
    return this.__apiStartTime.value <= 0 || this.__apiEndTime.value === 0
  }
}

export class MadisonAddonDataQueryTask<DATA> {
  readonly id: string
  readonly showMsg: string
  readonly path: RouteLocationRaw
  readonly timestamp: number
  readonly check: (route: RouteLocationNormalizedLoadedGeneric) => boolean
  status: MadisonDataQueryTaskStatus = MadisonDataQueryTaskStatus.READY
  quering: boolean = true
  data: DATA | null = null

  constructor(id: string, path: RouteLocationRaw, showMsg: string, checkFunc: (route: RouteLocationNormalizedLoadedGeneric) => boolean) {
    this.id = id
    this.path = path
    this.showMsg = showMsg
    this.timestamp = Date.now()
    this.check = checkFunc
  }
}
