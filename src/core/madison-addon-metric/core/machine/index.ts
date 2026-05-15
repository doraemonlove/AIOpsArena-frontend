import { MadisonAddon, MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import { computed, ref, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { MetricMachineDatabase, MetriMachineDataDetail } from './data'
import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw, RouteRecordName } from 'vue-router'
import { MadisonDataQueryTaskStatus, type RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { createLoopQuery, formatDate, isNumber, LRUCache } from '@/core/madison/utils'
import { NodeOrPod } from './nplist'
import { getMachinemetric, getMachinemetricData, getNodeList, getPodlist } from '../api'
import type { MetricType } from '../../types'

const METRIC_ROUTE_NAMES = new Set<RouteRecordName>([
  'metricmachine',
  'metricsmachinenode',
  'metricsmachinepod',
  'metricsmachineservice',
  'metricsmachinetidb'
])

export const MACHINE_TIME_RANGE_OPTIONS = [
  { key: '1m', label: '1m', seconds: 60 },
  { key: '5m', label: '5m', seconds: 5 * 60 },
  { key: '15m', label: '15m', seconds: 15 * 60 },
  { key: '30m', label: '30m', seconds: 30 * 60 },
  { key: '1h', label: '1h', seconds: 60 * 60 },
  { key: '2h', label: '2h', seconds: 2 * 60 * 60 },
  { key: '6h', label: '6h', seconds: 6 * 60 * 60 },
  { key: '12h', label: '12h', seconds: 12 * 60 * 60 },
  { key: '1d', label: '1d', seconds: 24 * 60 * 60 },
  { key: '2d', label: '2d', seconds: 2 * 24 * 60 * 60 },
  { key: '1w', label: '1w', seconds: 7 * 24 * 60 * 60 }
] as const

const DEFAULT_MACHINE_TIME_RANGE_KEY = '2h'

function getMachineRangeOption(key: string) {
  return (
    MACHINE_TIME_RANGE_OPTIONS.find((item) => item.key === key) ||
    MACHINE_TIME_RANGE_OPTIONS.find((item) => item.key === DEFAULT_MACHINE_TIME_RANGE_KEY)!
  )
}

function getMachineRangeOptionBySeconds(seconds: number) {
  return (
    MACHINE_TIME_RANGE_OPTIONS.find((item) => item.seconds === seconds) ||
    MACHINE_TIME_RANGE_OPTIONS.find((item) => item.key === DEFAULT_MACHINE_TIME_RANGE_KEY)!
  )
}

function getMachineRangeIndex(key: string) {
  const index = MACHINE_TIME_RANGE_OPTIONS.findIndex((item) => item.key === key)
  return index >= 0 ? index : MACHINE_TIME_RANGE_OPTIONS.findIndex((item) => item.key === DEFAULT_MACHINE_TIME_RANGE_KEY)
}

export class Machine extends MadisonAddon {
  readonly MAX_INTERVAL = Math.floor(Date.now() / 1000)
  private __isCreatingQueryTask: Ref<boolean> = ref(false)
  private __type: Ref<MetricType> = ref('node')
  private __queryType: Ref<MetricType> = ref('node')
  private __target: Ref<string> = ref('')
  private __queryTarget: Ref<string> = ref('')
  private __namespace: Ref<string> = ref('')
  private __queryNamespace: Ref<string> = ref('')
  private __metricName: Ref<string> = ref('')
  private __queryMetricName: Ref<string> = ref('')
  private __displayStartTime: Ref<number> = ref(0)
  private __displayEndTime: Ref<number> = ref(0)
  private __apiStartTime: Ref<number> = ref(0)
  private __apiEndTime: Ref<number> = ref(0)
  private __rangeKey: Ref<string> = ref(DEFAULT_MACHINE_TIME_RANGE_KEY)
  private __queryRangeKey: Ref<string> = ref(DEFAULT_MACHINE_TIME_RANGE_KEY)
  private __metricNameList: ComputedRef<string[]> = computed(() => {
    return this.__metricName.value.split(',').filter((str) => str !== '')
  })
  private __queryMetricNameList: ComputedRef<string[]> = computed(() => {
    return this.__queryMetricName.value.split(',').filter((str) => str !== '')
  })
  private __displayIdList: ComputedRef<string[]> = computed(() => {
    const namespace = this.__namespace.value
    const type = this.__type.value
    const target = this.__target.value || 'all'
    const metricNameList = this.__metricNameList.value
    const startTime = this.__displayStartTime.value.toString()
    const endTime = this.__displayEndTime.value.toString()
    return metricNameList.map((metricName) => `${namespace}/${type}/${target}/${metricName}/${startTime}/${endTime}`)
  })
  /** Map<taskId, func> */
  protected __loopStopFuncs: Map<string, () => void> = new Map()
  private __nodeListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()
  private __podListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()
  private __db: MetricMachineDatabase = new MetricMachineDatabase((key, value) => {
    if (value.data) this.__madison.off('theme-change', value.data.themeChange)
  })

  get data(): ComputedRef<MadisonAddonDataQueryTask<MetriMachineDataDetail>[]> {
    return computed(() => {
      return this.__displayIdList.value
        .map((id) => this.__db.get(id))
        .filter((task): task is MadisonAddonDataQueryTask<MetriMachineDataDetail> => task !== undefined)
    })
  }

  get selectedMetricName(): ComputedRef<Set<string>> {
    return computed(() => new Set(this.__metricNameList.value))
  }

  get namespace(): ComputedRef<string> {
    return computed(() => this.__namespace.value)
  }

  get type(): ComputedRef<MetricType> {
    return computed(() => this.__type.value)
  }

  get target(): ComputedRef<string> {
    return computed(() => this.__target.value)
  }

  get hasTarget(): ComputedRef<boolean> {
    return computed(() => this.__type.value === 'tidb' || this.__target.value !== '')
  }

  get nodeOrPodList(): ComputedRef<NodeOrPod[]> {
    return computed(() => {
      const namespace = this.__namespace.value
      if (this.__type.value === 'node') {
        return this.__nodeListMap.get(namespace) || []
      }
      if (this.__type.value === 'pod') {
        return this.__podListMap.get(namespace) || []
      }
      return []
    })
  }

  get displayStartTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__apiStartTime.value * 1000))
  }

  get displayEndTime(): ComputedRef<Date> {
    return computed(() => new Date(this.__apiEndTime.value * 1000))
  }

  get endTime(): WritableComputedRef<Date | null, Date | null> {
    return computed({
      get: (): Date | null => {
        if (this.__apiEndTime.value === 0) return null
        return new Date(this.__apiEndTime.value * 1000)
      },
      set: (value: Date | null) => {
        if (!value) return
        const nextEndTime = Math.min(Math.floor(value.getTime() / 1000), Math.floor(Date.now() / 1000))
        const rangeSeconds = getMachineRangeOption(this.__queryRangeKey.value).seconds
        this.__apiEndTime.value = nextEndTime
        this.__apiStartTime.value = nextEndTime - rangeSeconds
      }
    })
  }

  get selectedRangeKey(): WritableComputedRef<string, string> {
    return computed({
      get: () => this.__queryRangeKey.value,
      set: (value: string) => {
        const option = getMachineRangeOption(value)
        this.__queryRangeKey.value = option.key
        this.__apiStartTime.value = this.__apiEndTime.value - option.seconds
      }
    })
  }

  get rangeOptions(): ComputedRef<typeof MACHINE_TIME_RANGE_OPTIONS> {
    return computed(() => MACHINE_TIME_RANGE_OPTIONS)
  }

  get currentRangeLabel(): ComputedRef<string> {
    return computed(() => getMachineRangeOption(this.__queryRangeKey.value).label)
  }

  get isCreatingQueryTask(): ComputedRef<boolean> {
    return computed(() => this.__isCreatingQueryTask.value)
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
    madison.routerPromise.addCheck(this.checkNodeList, this)
    madison.routerPromise.addCheck(this.checkPodList, this)

    watch(this.data, (newVal, oldVal) => {
      const newId = new Set(newVal.map((item) => item.id))
      oldVal.forEach((item) => {
        if (!newId.has(item.id) && item.data) {
          item.data.distory()
        }
      })
    })
  }

  logoutCallback(): void {
    this.__db.clear()
    this.__type.value = 'node'
    this.__queryType.value = 'node'
    this.__target.value = ''
    this.__queryTarget.value = ''
    this.__namespace.value = ''
    this.__queryNamespace.value = ''
    this.__metricName.value = ''
    this.__queryMetricName.value = ''
    this.__displayStartTime.value = 0
    this.__displayEndTime.value = 0
    this.__apiStartTime.value = 0
    this.__apiEndTime.value = 0
    this.__rangeKey.value = DEFAULT_MACHINE_TIME_RANGE_KEY
    this.__queryRangeKey.value = DEFAULT_MACHINE_TIME_RANGE_KEY
  }

  protected checkSTANDET(to: RouteLocationNormalized): true | RouterPromiseSyncFuncRes {
    const endTimeStr = to.query.endTime
    const rangeStr = to.query.range as string
    const legacyStartTimeStr = to.query.startTime as string

    if (!endTimeStr && !rangeStr && !legacyStartTimeStr) {
      this.__displayStartTime.value = 0
      this.__displayEndTime.value = 0
      this.__apiStartTime.value = 0
      this.__apiEndTime.value = 0
      this.__queryRangeKey.value = DEFAULT_MACHINE_TIME_RANGE_KEY
      return true
    }

    if (endTimeStr && rangeStr && isNumber(endTimeStr as string)) {
      const endTime = parseInt(endTimeStr as string)
      const rangeOption = getMachineRangeOption(rangeStr)
      const startTime = endTime - rangeOption.seconds
      if (endTime > Date.now() / 1000 || endTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, endTime: null, range: null }, params: to.params }]
      }
      if (startTime > Date.now() / 1000 || startTime <= 0) {
        return ['redirect', { name: to.name, query: { ...to.query, endTime: null, range: null }, params: to.params }]
      }
      this.__apiEndTime.value = endTime
      this.__apiStartTime.value = startTime
      this.__queryRangeKey.value = rangeOption.key
      return true
    }

    if (legacyStartTimeStr && endTimeStr && isNumber(legacyStartTimeStr) && isNumber(endTimeStr as string)) {
      const startTime = parseInt(legacyStartTimeStr)
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
      const rangeOption = getMachineRangeOptionBySeconds(range)
      return [
        'redirect',
        {
          name: to.name,
          query: {
            ...to.query,
            startTime: null,
            endTime,
            range: rangeOption.key
          },
          params: to.params
        }
      ]
    }
    return ['redirect', { name: to.name, query: { ...to.query, endTime: null, range: null, startTime: null }, params: to.params }]
  }

  private isMetricRoute(to: RouteLocationNormalized) {
    return METRIC_ROUTE_NAMES.has(to.name || '')
  }

  private resolveType(to: RouteLocationNormalized): MetricType | null {
    if (to.name === 'metricsmachinenode') return 'node'
    if (to.name === 'metricsmachinepod') return 'pod'
    if (to.name === 'metricsmachineservice') return 'service'
    if (to.name === 'metricsmachinetidb') return 'tidb'
    if (to.name === 'metricmachine') {
      const type = to.query.type as string
      if (type === 'node' || type === 'pod') return type
      return null
    }
    return null
  }

  private getTargetKey(type: MetricType) {
    if (type === 'node') return 'node'
    if (type === 'pod') return 'pod'
    if (type === 'service') return 'service'
    return null
  }

  private targetRequired(to: RouteLocationNormalized) {
    return to.name === 'metricmachine'
  }

  private precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (!this.isMetricRoute(to)) return
    const query = to.query
    const namespace = query.namespace as string
    if (!namespace) {
      return ['redirect', { name: 'data', query: {} }]
    }

    const type = this.resolveType(to)
    if (type === null) {
      if (to.name === 'metricmachine') {
        return ['redirect', { name: 'metricmachine', query: { ...query, type: 'node' } }]
      }
      return ['redirect', { name: 'metricsmachinenode', query: { namespace } }]
    }

    this.__queryType.value = type
    this.__queryNamespace.value = namespace

    const targetKey = this.getTargetKey(type)
    const target = targetKey ? ((query[targetKey] as string) || '') : ''
    if (!target && this.targetRequired(to) && type !== 'tidb') {
      return ['redirect', { name: 'metric', query: {} }]
    }
    this.__queryTarget.value = target

    const metricNameStr = query.metricName as string
    const metricName = metricNameStr ? metricNameStr.split(',').map((v) => v.trim()) : []
    const setMetricName = new Set(metricName)
    const noEmptyList = Array.from(setMetricName).filter((v) => v)
    if (metricName.length !== noEmptyList.length) {
      return ['redirect', { name: to.name, query: { ...query, metricName: noEmptyList.join(',') } }]
    }
    this.__queryMetricName.value = noEmptyList.join(',')

    const tCheck = this.checkSTANDET(to)
    if (tCheck !== true) return tCheck
    if (!to.query.endTime || !to.query.range) {
      return [
        'redirect',
        {
          name: to.name,
          query: {
            ...query,
            endTime: Math.floor(Date.now() / 1000),
            range: DEFAULT_MACHINE_TIME_RANGE_KEY,
            startTime: null
          }
        }
      ]
    }
  }

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, (to) => this.isMetricRoute(to))
    if (!can) return
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    if (!this.__madison.namespace.queryNamespaceIsValid) return { name: 'data' }
    await this.__madison.metric.waitingForMetricName
    const hasMetricNamespace = this.__madison.metric.hasNamespace(this.__queryNamespace.value)
    if (!hasMetricNamespace) return { name: 'data' }
    const checkRes = this.checkMachineMetricName(to, this.__queryMetricNameList.value)
    if (checkRes !== true) return checkRes

    if (this.__queryMetricNameList.value.length === 0) return
    if (this.__queryType.value !== 'tidb' && this.__queryTarget.value === '') return

    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const target = this.__queryTarget.value || 'all'
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()
    const needQuery: string[] = []
    this.__queryMetricNameList.value.forEach((metricName) => {
      const key = `${namespace}/${type}/${target}/${metricName}/${startTime}/${endTime}`
      if (!this.__db.has(key)) needQuery.push(metricName)
    })
    await this.getMetricData(needQuery)
  }

  private postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (!this.isMetricRoute(to)) return
    this.__isCreatingQueryTask.value = false
    this.applyQueryStateToDisplay()
  }

  private applyQueryStateToDisplay() {
    this.__type.value = this.__queryType.value
    this.__target.value = this.__queryTarget.value
    this.__namespace.value = this.__queryNamespace.value
    this.__metricName.value = this.__queryMetricName.value
    this.__displayStartTime.value = this.__apiStartTime.value
    this.__displayEndTime.value = this.__apiEndTime.value
    this.__rangeKey.value = this.__queryRangeKey.value
  }

  private checkMachineMetricName(
    to: RouteLocationNormalized,
    metricName: string[]
  ): RouteLocationRaw | true {
    const checkerF = this.__madison.metric.getMetricName(this.__queryNamespace.value)
    if (!checkerF) {
      return { name: 'metric', query: {} }
    }
    const checker = checkerF.getByType(this.__queryType.value)
    const checkedMetricName = metricName.filter((name) => checker.has(name))
    if (checkedMetricName.length !== metricName.length) {
      return {
        name: to.name,
        query: {
          ...to.query,
          metricName: checkedMetricName.join(',')
        }
      }
    }
    return true
  }

  private async getMetricData(metricNameList: string[]) {
    this.__isCreatingQueryTask.value = true
    const asyncList: Promise<void>[] = []
    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const target = this.__queryTarget.value || 'all'
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()

    metricNameList.forEach((metricName) => {
      const key = `${namespace}/${type}/${target}/${metricName}/${startTime}/${endTime}`
      const task = new MadisonAddonDataQueryTask<MetriMachineDataDetail>(
        key,
        { name: 'metric', query: {} },
        `
          <p class="text-[12px]">
          namespace: ${namespace}<br/>
          target: ${target}<br/>
          startTime: ${formatDate(new Date(this.__apiStartTime.value * 1000))}<br/>
          endTime: ${formatDate(new Date(this.__apiEndTime.value * 1000))}<br/>
          </p>
        `,
        () => true
      )
      this.__db.set(key, task)
      asyncList.push(
        (async () => {
          const res = await getMachinemetric({
            namespace: this.__queryNamespace.value,
            metricName,
            startTime: this.__apiStartTime.value,
            endTime: this.__apiEndTime.value,
            metricType: this.__queryType.value,
            ...(this.__queryType.value === 'node' ? { node: this.__queryTarget.value } : {}),
            ...(this.__queryType.value === 'pod' ? { pod: this.__queryTarget.value } : {}),
            ...(this.__queryType.value === 'service' ? { service: this.__queryTarget.value } : {})
          } as any)
          const data = res.data
          if (data.code !== 0) return
          const taskId = data.data.task_id
          const { stop } = createLoopQuery(
            { taskId },
            getMachinemetricData,
            (res) => res.data.status === 'SUCCESS' || res.data.status === 'FAILURE',
            (res) => {
              this.__loopStopFuncs.delete(key)
              const status = res.data.status
              const result = res.data.result
              const task = this.__db.get(key)
              if (task === undefined) return
              if (result !== null && result !== undefined) {
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
              task.status =
                status === 'SUCCESS'
                  ? MadisonDataQueryTaskStatus.SUCCESS
                  : MadisonDataQueryTaskStatus.ERROR
            },
            () => {
              const task = this.__db.get(key)
              if (task === undefined) return
              task.status = MadisonDataQueryTaskStatus.ERROR
            },
            () => {}
          )
          this.__loopStopFuncs.set(key, stop)
        })()
      )
    })
    await Promise.all(asyncList)
  }

  async checkPodList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, (to) => this.isMetricRoute(to))
    if (!can) return
    if (this.__queryType.value !== 'pod') return
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    if (!this.__madison.namespace.queryNamespaceIsValid) return
    const namespace = this.__queryNamespace.value
    if (this.__podListMap.has(namespace)) return

    const listData = await getPodlist({ namespace })
    if (listData.data.code === 0) {
      this.__podListMap.set(namespace, listData.data.data.map((name) => new NodeOrPod(name, 'pod')))
    }
  }

  async checkNodeList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, (to) => this.isMetricRoute(to))
    if (!can) return
    if (this.__queryType.value !== 'node') return
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    if (!this.__madison.namespace.queryNamespaceIsValid) return
    const namespace = this.__queryNamespace.value
    if (this.__nodeListMap.has(namespace)) return

    const listData = await getNodeList({ namespace })
    if (listData.data.code === 0) {
      this.__nodeListMap.set(namespace, listData.data.data.map((name) => new NodeOrPod(name, 'node')))
    }
  }

  createQueryTask() {
    const currentRoute = this.__madison.routerPromise.router.currentRoute.value
    const routeName = (currentRoute.name || 'metricmachine') as string
    const query: Record<string, string | number | null> = {
      namespace: this.__queryNamespace.value,
      endTime: this.__apiEndTime.value,
      range: this.__queryRangeKey.value,
      startTime: null,
      metricName: this.__queryMetricName.value === '' ? null : this.__queryMetricName.value
    }

    if (routeName === 'metricmachine') {
      query.type = this.__type.value
    }

    if (this.__type.value === 'node' && this.__queryTarget.value) query.node = this.__queryTarget.value
    if (this.__type.value === 'pod' && this.__queryTarget.value) query.pod = this.__queryTarget.value
    if (this.__type.value === 'service' && this.__queryTarget.value) query.service = this.__queryTarget.value

    this.__madison.routerPromise.router.push({
      name: routeName,
      query
    })
  }

  async refreshMetricDataInPlace() {
    if (this.__queryMetricNameList.value.length === 0) {
      this.applyQueryStateToDisplay()
      return
    }
    if (this.__queryType.value !== 'tidb' && this.__queryTarget.value === '') {
      this.applyQueryStateToDisplay()
      return
    }

    this.__isCreatingQueryTask.value = true
    const namespace = this.__queryNamespace.value
    const type = this.__queryType.value
    const target = this.__queryTarget.value || 'all'
    const startTime = this.__apiStartTime.value.toString()
    const endTime = this.__apiEndTime.value.toString()
    const needQuery: string[] = []

    this.__queryMetricNameList.value.forEach((metricName) => {
      const key = `${namespace}/${type}/${target}/${metricName}/${startTime}/${endTime}`
      if (!this.__db.has(key)) needQuery.push(metricName)
    })

    try {
      await this.getMetricData(needQuery)
      this.applyQueryStateToDisplay()
    } finally {
      this.__isCreatingQueryTask.value = false
    }
  }

  shiftEndTime(direction: -1 | 1) {
    const rangeSeconds = getMachineRangeOption(this.__queryRangeKey.value).seconds
    const now = Math.floor(Date.now() / 1000)
    const nextEndTime = Math.min(now, Math.max(rangeSeconds, this.__apiEndTime.value + direction * rangeSeconds))
    this.__apiEndTime.value = nextEndTime
    this.__apiStartTime.value = nextEndTime - rangeSeconds
    this.refreshMetricDataInPlace()
  }

  shiftRange(direction: -1 | 1) {
    const currentIndex = getMachineRangeIndex(this.__queryRangeKey.value)
    const nextIndex = Math.max(0, Math.min(MACHINE_TIME_RANGE_OPTIONS.length - 1, currentIndex + direction))
    const option = MACHINE_TIME_RANGE_OPTIONS[nextIndex]
    this.__queryRangeKey.value = option.key
    this.__apiStartTime.value = this.__apiEndTime.value - option.seconds
    this.refreshMetricDataInPlace()
  }

}
