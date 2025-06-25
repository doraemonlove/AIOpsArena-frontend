import { MadisonAddonDataS2E } from '@/core/madison/core/addon-base'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { computed, ref, type ComputedRef, type Ref, watch } from 'vue'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { MetricDataDetail, MetricDataManager } from './data'
import { LRUCache } from '@/core/madison/utils'
import { getMachinemetric, getNodeList, getPodlist } from '../api'
import type { Madison } from '@/core/madison/core'
import { NodeOrPod } from './nplist'

export class Machine extends MadisonAddonDataS2E<MetricDataDetail> {
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
  private __metricNameList: ComputedRef<string[]> = computed(() => {
    return this.__metricName.value.split(',').filter((str) => str !== '')
  })
  private __queryMetricNameList: ComputedRef<string[]> = computed(() => {
    return this.__queryMetricName.value.split(',').filter((str) => str !== '')
  })
  /**
   * metricDataDetail的id
   */
  private __queryMetricDataDetailId: ComputedRef<string> = computed(
    () => this.__queryStartTime.value.toString() + '-' + this.__queryEndTime.value.toString() + '-' + (this.__queryType.value === 'node' ? this.__queryNode.value : this.__queryPod.value)
  )
  private __metricDataDetailId: ComputedRef<string> = computed(
    () => this.__startTime.value.toString() + '-' + this.__endTime.value.toString() + '-' +  (this.__type.value === 'node' ? this.__node.value : this.__pod.value)
  )
  /**
   * <namespace, >
   */
  private __dataMap: LRUCache<string, { node: MetricDataManager; pod: MetricDataManager }> =
    new LRUCache(10)

  private __asyncDisable = false

  private __nodeListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()
  private __podListMap: LRUCache<string, NodeOrPod[]> = new LRUCache()

  /**
   * 数据展示
   */
  get data(): ComputedRef<MetricDataDetail[]> {
    return computed(() => {
      const namespace = this.__namespace.value
      const type = this.__type.value
      const metricName = this.__metricNameList.value
      const metricDataDetailId = this.__metricDataDetailId.value
      const manager = this.getManager(namespace, type)
      return manager.getData(metricName, metricDataDetailId)
    })
  }

  /**
   * 选择的的metricName
   */
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

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addCheck(this.checkPodList, this)
    madison.routerPromise.addCheck(this.checkNodeList, this)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)

    /**
     * 销毁没有用的metricDataDetail
     */
    watch(this.data, (newVal: MetricDataDetail[], oldVal: MetricDataDetail[]) => {
      const newId = new Set()
      newVal.forEach((item) => {
        newId.add(item.id)
      })
      oldVal.forEach((item) => {
        if (!newId.has(item.id)) {
          item.distory()
        }
      })
    })
  }

  logoutCallback(): void {
    this.__dataMap.clear()
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
    super.logoutCallback()
  }

  precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (to.name !== 'displaymetricmachine') return
    const query = to.query
    //
    // 检查namespace
    //
    const namespace = query.namespace as string
    if (!namespace) {
      return [
        'redirect',
        {
          name: 'metric',
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
          name: 'displaymetricmachine',
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
    const metricName = metricNameStr
      ? metricNameStr
        .split(',')
        .map((v) => v.trim())
      : []
    const setMetricName = new Set(metricName)
    const noEmptyList = Array.from(setMetricName).filter((v) => v)
    //
    // 删除重复的、删除空字符串
    //
    if (metricName.length !== noEmptyList.length) {
      return [
        'redirect',
        {
          name: 'displaymetricmachine',
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
          name: 'displaymetricmachine',
          query: {
            ...query,
            startTime: Math.floor(Date.now() / 1000) - 60 * 30,
            endTime: Math.floor(Date.now() / 1000)
          }
        }
      ]
    }
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'displaymetricmachine')
    if (!can) return
    this.__asyncDisable = true
    await this.__madison.metric.waitingForMetricName
    //
    // 检查namespace
    //
    const res = this.__madison.metric.hasNamespace(this.__queryNamespace.value)
    if (!res) return
    const checkRes = this.checkMachineMetricName(to, this.__queryMetricNameList.value)
    if (checkRes !== true) return checkRes
    //
    // 现在的metricName是正确的
    //
    const manager = this.getManager(this.__queryNamespace.value, this.__queryType.value)
    //
    // 直接加入
    //
    manager.add(this.__queryMetricNameList.value)
    //
    // 查看需要查询哪些
    //
    const needQuery = manager.checkDataExist(
      this.__queryMetricNameList.value,
      this.__queryMetricDataDetailId.value
    )

    await this.getMetricData(manager, needQuery)
  }

  postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    if (to.name !== 'displaymetricmachine') return
    this.__asyncDisable = false
    this.__type.value = this.__queryType.value
    this.__namespace.value = this.__queryNamespace.value
    this.__metricName.value = this.__queryMetricName.value
    if (this.__type.value === 'node') {
      this.__node.value = this.__queryNode.value
    } else {
      this.__pod.value = this.__queryPod.value
    }
    this.__startTime.value = this.__queryStartTime.value
    this.__endTime.value = this.__queryEndTime.value
  }

  private getManager(namespace: string, type: 'node' | 'pod') {
    if (!this.__dataMap.has(namespace)) {
      this.__dataMap.set(namespace, {
        node: new MetricDataManager([], this.__madison),
        pod: new MetricDataManager([], this.__madison)
      })
    }
    const ms = this.__dataMap.get(namespace) as { node: MetricDataManager; pod: MetricDataManager }
    return ms[type]
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
        name: 'displaymetricmachine',
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
  private async getMetricData(manager: MetricDataManager, metricName: string[]) {
    this.__searching.value = true
    const asyncList: Promise<void>[] = []
    metricName.forEach((name) => {
      const func = async () => {
        const res = await getMachinemetric({
          namespace: this.__queryNamespace.value,
          metricName: name,
          startTime: this.__apiUseStartTime.value,
          endTime: this.__apiUseEndTime.value,
          metricType: this.__queryType.value,
          node: this.__queryNode.value,
          pod: this.__queryPod.value
        })
        const data = res.data
        if (data.code === 0) {
          manager.set(name, this.__queryMetricDataDetailId.value, data.data)
        }
      }
      asyncList.push(func())
    })
    await Promise.all(asyncList)
    this.__searching.value = false
  }

  /**
   * 手动调整时间范围，会直接路由跳转
   * @param timestamp
   * @param duration
   */
  checkRangeData(timestamp: number, duration: number): void
  checkRangeData(timestamp: Date, duration: number): void
  checkRangeData(timestamp: number | Date, duration: number): void {
    if (timestamp instanceof Date) {
      timestamp = timestamp.getTime()
    }
    const route = this.__madison.routerPromise.router.currentRoute.value
    this.__madison.routerPromise.router.push({
      name: route.name,
      query: { ...route.query, timestamp: timestamp as number, duration: duration }
    })
  }

  async checkPodList(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'displaymetricmachine')
    if (!can) return
    if (this.__queryType.value === 'node') return
    await this.__madison.metric.waitingForMetricName
    //
    // 检查namespace
    //
    const res = this.__madison.metric.hasNamespace(this.__queryNamespace.value)
    if (!res) return
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
    const can = await this.defNoNSCheck(to, from, 'displaymetricmachine')
    if (!can) return
    if (this.__queryType.value === 'pod') return
    await this.__madison.metric.waitingForMetricName
    //
    // 检查namespace
    //
    const res = this.__madison.metric.hasNamespace(this.__queryNamespace.value)
    if (!res) return
    const namespace = this.__queryNamespace.value
    if (this.__nodeListMap.has(namespace)) return

    const listData = await getNodeList({ namespace })
    const data = listData.data
    if (data.code === 0) {
      const list = data.data.map((name) => new NodeOrPod(name, 'node'))
      this.__nodeListMap.set(namespace, list)
    }
  }

  /**
   * 在选择好namespace等数据之后直接调用函数
   */
  query() {
    this.__madison.routerPromise.router.push({
      name: 'displaymetricmachine',
      query: {
        namespace: this.__queryNamespace.value,
        startTime: this.__queryStartTime.value,
        endTime: this.__queryEndTime.value,
        metricName: this.__queryMetricName.value === '' ? null : this.__queryMetricName.value,
        type: this.__type.value,
        [this.__type.value]: this.__type.value === 'node' ? this.__queryNode.value : this.__queryPod.value
      }
    })
  }
}
