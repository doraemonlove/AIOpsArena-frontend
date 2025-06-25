import {
  computed,
  ref,
  watch,
  type ComputedRef,
  type Reactive,
  type Ref,
  type WritableComputedRef
} from 'vue'
import { debounce, isNumber, LRUCache, parseTimeToSeconds } from '../../utils'
import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router'
import { MadisonAddon } from '.'
import type { Madison } from '..'
import { MadisonDataLoaderStatus, type RouterPromiseSyncFuncRes } from '../../types'

export abstract class MadisonAddonDataBaseLoader<DATA> {
  readonly id: string
  readonly taskId: string
  readonly namespace: string

  useRouter: () => Router
  status: MadisonDataLoaderStatus = MadisonDataLoaderStatus.READY
  data: DATA | null = null
  msg: string

  constructor(id: string, taskId: string, namespace: string, useRouter: () => Router, msg: string = '') {
    this.id = id
    this.taskId = taskId
    this.namespace = namespace
    this.useRouter = useRouter
    this.msg = msg

    this.load()
  }

  abstract load(): void

  abstract show(): void

  abstract distory(): void
}

export abstract class MadisonAddonDataStart2EndLoader<
  DATA
> extends MadisonAddonDataBaseLoader<DATA> {
  startTime: Date
  endTime: Date

  constructor(id: string, taskId: string, namespace: string, useRouter: () => Router, startTime: Date, endTime: Date, msg: string = '') {
    super(id, taskId, namespace, useRouter, msg)

    this.startTime = startTime
    this.endTime = endTime
  }
}

export abstract class MadisonAddonDataTimestamp2RangeLoader<
  DATA
> extends MadisonAddonDataBaseLoader<DATA> {
  timestamp: Date
  range: string

  constructor(id: string, taskId: string, namespace: string, useRouter: () => Router, timestamp: Date, range: string, msg: string = '') {
    super(id, taskId, namespace, useRouter, msg)

    this.timestamp = timestamp
    this.range = range
  }
}

export abstract class MadisonAddonDataQueryBase<DATA> extends MadisonAddon {
  /** LRU大小 */
  readonly size: number
  /** 最大时间间隔 */
  readonly MAX_INTERVAL = Date.now()
  /** 提供给check方法的查询起始时刻 s */
  protected abstract __apiUseStartTime: Ref<number> | WritableComputedRef<number, number>
  /** 提供给check方法的查询结束时刻 s */
  protected abstract __apiUseEndTime: Ref<number> | WritableComputedRef<number, number>

  protected abstract __data: Reactive<LRUCache<string, MadisonAddonDataBaseLoader<DATA>>>

  protected __currentId: Ref<string | null> = ref(null)
  protected __currentNamespace: Ref<string> = ref('')
  get querying(): ComputedRef<boolean> {
    return computed(() => {
      if (this.__currentId.value === null) return false
      const loader = this.__data.get(this.__currentId.value)
      if (loader === undefined) return false
      return loader.status === MadisonDataLoaderStatus.LOADING
    })
  }

  get disabled(): ComputedRef<boolean> {
    return computed(() => this.__currentId === null)
  }

  abstract get data(): ComputedRef<MadisonAddonDataBaseLoader<DATA> | null>

  abstract get dataList(): ComputedRef<MadisonAddonDataBaseLoader<DATA>[]>

  constructor(madison: Madison, size: number = 30) {
    super(madison)

    this.size = size

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  logoutCallback(): void {
    this.__data.clear()
    this.__currentId.value = null
  }

  abstract clearId(): void

  abstract precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes

  abstract check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void>

  abstract postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes

  abstract query(): void

  abstract removeLoader(id: string): boolean
}

export abstract class MadisonAddonDataStart2End<DATA> extends MadisonAddonDataQueryBase<DATA> {
  protected abstract __data: Reactive<LRUCache<string, MadisonAddonDataStart2EndLoader<DATA>>>
  protected __apiUseStartTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)
  protected __apiUseEndTime: Ref<number, number> | WritableComputedRef<number, number> = ref(0)
  /** 当前展示数据的起始时刻 s */
  protected __currentStartTime: ComputedRef<number> = computed(() => {
    if (this.__currentId.value === null) return 0
    const loader = this.__data.get(this.__currentId.value)
    if (loader === undefined) return 0
    return Math.floor(loader.startTime.getTime() / 1000)
  })
  /** 当前展示数据的结束时刻 s */
  protected __currentEndTime: ComputedRef<number> = computed(() => {
    if (this.__currentId.value === null) return 0
    const loader = this.__data.get(this.__currentId.value)
    if (loader === undefined) return 0
    return Math.floor(loader.endTime.getTime() / 1000)
  })
  /** 临时数据存储 */
  protected __queryStartTime: Ref<number> = ref(0)
  /** 临时数据存储 */
  protected __queryEndTime: Ref<number> = ref(0)
  /** 提供给日期时间选择器的起始时刻 */
  get startTime(): WritableComputedRef<number, number> {
    return computed({
      get: () => {
        return this.__currentStartTime.value
      },
      set: (val) => {
        this.__queryStartTime.value = val
      }
    })
  }
  /** 提供给日期时间选择器的结束时刻 */
  get endTime(): WritableComputedRef<number, number> {
    return computed({
      get: () => {
        return this.__currentEndTime.value
      },
      set: (val) => {
        this.__queryEndTime.value = val
      }
    })
  }
  /** 提供给日期时间选择器的起始时刻 */
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
  /** 提供给日期时间选择器的结束时刻 */
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
  /** 提供给日期时间选择器 */
  get timeRange(): WritableComputedRef<string | [Date, Date], [Date, Date]> {
    return computed({
      get: (): string | [Date, Date] => {
        if (this.__queryStartTime.value === 0 || this.__queryEndTime.value === 0) {
          return ''
        }
        return [this.startTimeDate.value, this.endTimeDate.value]
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
    this.__queryStartTime.value = 0
    this.__queryEndTime.value = 0
  }

  /**
   * check timestamp and range
   * @param to
   */
  protected checkSTANDET(to: RouteLocationNormalized): true | RouterPromiseSyncFuncRes {
    const startTimeStr = to.query.startTime
    const endTimeStr = to.query.endTime
    /** first in */
    if (
      !startTimeStr &&
      !endTimeStr &&
      this.__currentStartTime.value === 0 &&
      this.__currentEndTime.value === 0
    ) {
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
            query: { ...to.query, startTime: Math.floor(Date.now() / 1000) - 1 },
            params: to.params
          }
        ]
      }
      if (endTime > Date.now() / 1000 || endTime <= 0) {
        return [
          'redirect',
          {
            name: to.name,
            query: { ...to.query, endTime: Math.floor(Date.now() / 1000) },
            params: to.params
          }
        ]
      }
      if (range > this.MAX_INTERVAL || range < 0) {
        return [
          'redirect',
          {
            name: to.name,
            query: {
              ...to.query,
              startTime: Math.floor(Date.now() / 1000) - 1,
              endTime: Math.floor(Date.now() / 1000)
            },
            params: to.params
          }
        ]
      }
      this.__queryStartTime.value = startTime
      this.__queryEndTime.value = endTime
      return true
    }
    return [
      'redirect',
      {
        name: to.name,
        query: {
          ...to.query,
          startTime: this.__queryStartTime.value,
          endTime: this.__queryEndTime.value
        },
        params: to.params
      }
    ]
  }
}

export abstract class MadisonAddonDataTimestamp2Range<
  DATA
> extends MadisonAddonDataQueryBase<DATA> {
  protected abstract __data: Reactive<LRUCache<string, MadisonAddonDataTimestamp2RangeLoader<DATA>>>
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
  protected __selectedRangeIndexRef: Ref<number> = ref(0)
  /** 用户选择的 */
  protected __selectedRangeIndex: WritableComputedRef<number, number> = computed({
    get: () => {
      if (this.__currentId.value === null) return this.__selectedRangeIndexRef.value
      const loader = this.__data.get(this.__currentId.value)
      if (loader === undefined) return 0
      const range = loader.range
      const index = this.stepTimeList.findIndex((item) => item[1] === range)
      if (index !== -1) return index
      this.__inputRangeStr.value = range
      return 0
    },
    set: (index) => {
      this.__selectedRangeIndexRef.value = index
    }
  })
  protected __timestamp: Ref<number> = ref(0)
  /** 输入框用户输入的内容 */
  protected __inputRangeStr: Ref<string> = ref('')

  protected __apiUseStartTime: Ref<number, number> | WritableComputedRef<number, number> = computed(
    {
      get: () => {
        return this.__timestamp.value - parseTimeToSeconds(this.rangeStr.value)
      },
      set: (val) => {
        throw new Error('can not set apiUseStartTime')
      }
    }
  )

  protected __apiUseEndTime: Ref<number, number> | WritableComputedRef<number, number> = computed({
    get: () => {
      return this.__timestamp.value
    },
    set: (val) => {
      throw new Error('can not set apiUseEndTime')
    }
  })

  /** 给输入框 */
  get rangeStr(): WritableComputedRef<string, string> {
    return computed({
      get: () => {
        return this.__inputRangeStr.value
          ? this.__inputRangeStr.value
          : this.stepTimeList[this.__selectedRangeIndex.value][1]
      },
      set: (value: string) => {
        this.__inputRangeStr.value = value
      }
    })
  }

  get hasPrevStep(): ComputedRef<boolean> {
    return computed(() => this.__selectedRangeIndex.value > 0)
  }

  get hasNextStep(): ComputedRef<boolean> {
    return computed(() => this.__selectedRangeIndex.value < this.stepTimeList.length - 1)
  }

  get timestamp(): WritableComputedRef<Date | string, Date> {
    return computed({
      get: () => {
        if (this.__currentId.value === null) return this.__timestamp.value > 0 ? new Date(this.__timestamp.value * 1000) : ''
        const loader = this.__data.get(this.__currentId.value)
        if (loader === undefined) return this.__timestamp.value > 0 ? new Date(this.__timestamp.value * 1000) : ''
        return new Date(loader.timestamp)
      },
      set: (value: Date) => {
        this.__timestamp.value = Math.floor(value.getTime() / 1000)
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
      }
    })
  }

  protected debouncedChangeRangeDataTimestamp = debounce(this.changeRangeData('timestamp'), 200)
  protected debouncedChangeRangeDataRangeIndex = debounce(this.changeRangeData('range'), 200)

  constructor(madison: Madison) {
    super(madison)

    watch(this.__selectedRangeIndex, () => {
      this.__inputRangeStr.value = ''
    })
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
        return [
          'redirect',
          {
            name: to.name,
            query: { ...to.query, timestamp: Math.floor(Date.now() / 1000) },
            params: to.params
          }
        ]
      }
      if (range < 0 || timestamp - range < 0) {
        this.__inputRangeStr.value = ''
        return [
          'redirect',
          {
            name: to.name,
            query: {
              ...to.query,
              timestamp: Math.floor(Date.now() / 1000),
              range: this.stepTimeList[this.__selectedRangeIndex.value][1]
            },
            params: to.params
          }
        ]
      }
      this.__timestamp.value = timestamp
      const index = this.stepTimeList.findIndex((item) => item[1] === rangeStr)
      if (index > -1) {
        this.__selectedRangeIndex.value = index
        this.__inputRangeStr.value = ''
      } else {
        this.rangeStr.value = rangeStr as string
      }
      if (this.__apiUseEndTime.value - this.__apiUseStartTime.value > this.MAX_INTERVAL) {
        return [
          'redirect',
          {
            name: to.name,
            query: {
              ...to.query,
              timestamp: Math.floor(Date.now() / 1000),
              range: this.stepTimeList[0][1]
            },
            params: to.params
          }
        ]
      }
      return true
    }
    return [
      'redirect',
      {
        name: to.name,
        query: {
          ...to.query,
          timestamp: this.__timestamp.value,
          range: this.stepTimeList[this.__selectedRangeIndex.value][1]
        },
        params: to.params
      }
    ]
  }
}
