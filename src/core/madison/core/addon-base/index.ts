import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Madison } from '..'
import type { MadisonApiMsg, RouterPromiseSyncFuncRes } from '../../types'
import { computed, ref, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { debounce, isNumber, message, parseTimeToSeconds } from '../../utils'

export abstract class MadisonAddon {
  readonly apiMsg: MadisonApiMsg = {
    'zh-CN': {},
    'en-US': {}
  }

  protected readonly __madison: Madison

  constructor(madison: Madison) {
    this.__madison = madison

    madison.on('logout', this.logoutCallback, this)
  }

  abstract logoutCallback(): void

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
    if (to.name === 'login' || to.name === 'register') return false
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
  /** for all */
  protected __startTime: Ref<number> = ref(0)
  /** for all */
  protected __endTime: Ref<number> = ref(0)
  /** for all */
  protected __searching: Ref<boolean> = ref(false)
  /** for all, for api search */
  protected abstract __apiUseStartTime: Ref<number> | WritableComputedRef<number, number>
  /** for all, for api search */
  protected abstract __apiUseEndTime: Ref<number> | WritableComputedRef<number, number>

  get searching(): ComputedRef<boolean> {
    return computed(() => this.__searching.value)
  }

  abstract get data(): ComputedRef<DATA[]>

  abstract precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes
  abstract check(to: RouteLocationNormalized, from: RouteLocationNormalized): Promise<RouteLocationRaw | void>
  abstract postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes

  logoutCallback(): void {
    this.__searching.value = false
  }

  /**
   * 修改完数据后调用此函数进行**路由跳转**查询
   *
   * 具体查询数据函数应该挂载到routerPromise.check中
   */
  abstract query(): void
}

export abstract class MadisonAddonDataS2E<DATA> extends MadisonAddonDataBase<DATA> {
  protected __apiUseStartTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)
  protected __apiUseEndTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)

  protected __queryStartTime: WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__apiUseStartTime.value
    },
    set: (val) => {
      this.__apiUseStartTime.value = val
    }
  })

  protected __queryEndTime: WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__apiUseEndTime.value
    },
    set: (val) => {
      this.__apiUseEndTime.value = val
    }
  })

  get startTime(): WritableComputedRef<number, number> {
    return computed({
      get: () => {
        return this.__startTime.value
      },
      set: (val) => {
        this.__queryStartTime.value = val
      }
    })
  }

  get endTime(): WritableComputedRef<number, number> {
    return computed({
      get: () => {
        return this.__endTime.value
      },
      set: (val) => {
        this.__queryEndTime.value = val
      }
    })
  }

  get startTimeDate(): WritableComputedRef<Date, Date> {
    return computed({
      get: () => {
        return new Date(this.startTime.value * 1000)
      },
      set: (value: Date) => {
        this.startTime.value = Math.floor(value.getTime() / 1000)
      }
    })
  }

  get endTimeDate(): WritableComputedRef<Date, Date> {
    return computed({
      get: () => {
        return new Date(this.endTime.value * 1000)
      },
      set: (value: Date) => {
        this.endTime.value = Math.floor(value.getTime() / 1000)
      }
    })
  }

  get timeRange(): WritableComputedRef<string | [Date, Date], [Date, Date]> {
    return computed({
      get: (): string | [Date, Date] => {
        if (this.__queryStartTime.value === 0 || this.__queryEndTime.value === 0) {
          return ''
        }
        return [
          this.startTimeDate.value,
          this.endTimeDate.value
        ]
      },
      set: (value: [Date, Date]) => {
        this.startTimeDate.value = value[0]
        this.endTimeDate.value = value[1]
      }
    })
  }

  logoutCallback(): void {
    super.logoutCallback()
    this.__apiUseStartTime.value = 0
    this.__apiUseEndTime.value = 0
    this.__startTime.value = 0
    this.__endTime.value = 0
  }

  /**
   * check timestamp and range
   * @param to
   */
  protected checkSTANDET(to: RouteLocationNormalized): true | RouterPromiseSyncFuncRes {
    const startTimeStr = to.query.startTime
    const endTimeStr = to.query.endTime
    /** first in */
    if (!startTimeStr && !endTimeStr && this.__startTime.value === 0 && this.__endTime.value === 0) return true
    if (startTimeStr && endTimeStr && isNumber(startTimeStr as string) && isNumber(endTimeStr as string)) {
      const startTime = parseInt(startTimeStr as string)
      const endTime = parseInt(endTimeStr as string)
      const range = endTime - startTime
      if (startTime > Date.now() / 1000 || startTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, startTime: Math.floor(Date.now() / 1000) - 1 }, params: to.params }]
      }
      if (endTime > Date.now() / 1000 || endTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, endTime: Math.floor(Date.now() / 1000) }, params: to.params }]
      }
      if (range > this.MAX_INTERVAL || range < 0) {
        return ['redirect', { name: to.name, query: { ...to.query, startTime: Math.floor(Date.now() / 1000) - 1, endTime: Math.floor(Date.now() / 1000) }, params: to.params }]
      }
      this.__queryStartTime.value = startTime
      this.__queryEndTime.value = endTime
      return true
    }
    return ['redirect', { name: to.name, query: { ...to.query, startTime: this.__startTime.value, endTime: this.__endTime.value }, params: to.params }]
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

  protected __apiUseStartTime: Ref<number, number> | WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__timestamp.value - parseTimeToSeconds(this.rangeStr.value)
    },
    set: (val) => {
      throw new Error('can not set apiUseStartTime')
    }
  })

  protected __apiUseEndTime: Ref<number, number> | WritableComputedRef<number, number> = computed({
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
    /** first in */
    if (!timestampStr && !rangeStr && this.__timestamp.value === 0) return true
    if (timestampStr && rangeStr && isNumber([timestampStr as string])) {
      const timestamp = parseInt(timestampStr as string)
      const range = parseTimeToSeconds(rangeStr as string)
      if (timestamp > Date.now() / 1000 || timestamp <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, timestamp: Math.floor(Date.now() / 1000) }, params: to.params }]
      }
      if (range < 0 || timestamp - range < 0) {
        this.__inputRangeStr.value = ''
        return ['redirect', { name: to.name, query: { ...to.query, timestamp: Math.floor(Date.now() / 1000), range: this.stepTimeList[this.__selectedRangeIndex.value][1] }, params: to.params }]
      }
      this.__timestamp.value = timestamp
      const index = this.stepTimeList.findIndex((item) => item[1] === rangeStr)
      if (index > -1) {
        this.__selectedRangeIndex.value = index
        this.__inputRangeStr.value = ''
      } else {
        this.rangeStr.value = rangeStr as string
      }
      if (this.__apiUseEndTime.value - this.__apiUseStartTime.value > this.MAX_INTERVAL) return ['redirect', { name: to.name, query: { ...to.query, timestamp: Math.floor(Date.now() / 1000), range: this.stepTimeList[0][1] }, params: to.params }]
      return true
    }
    return ['redirect', { name: to.name, query: { ...to.query, timestamp: this.__timestamp.value, range: this.stepTimeList[this.__selectedRangeIndex.value][1] }, params: to.params }]
  }
}
