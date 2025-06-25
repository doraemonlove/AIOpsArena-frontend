import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { createTestbed, deleteTestbed, getDeleteRes, getInstallRes, getMicroservices, getTestbed, getTestbedQuota } from './api'
import { Microservice } from './microservice'
import { computed, ref, reactive, type Reactive } from 'vue'
import type { CreateTestbedOptions } from '../types'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import { Testbed as TestbedRow } from './testbed'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import { deepClone, message } from '@/core/madison/utils'
import { LoadItem } from '@/core/madison-addon-load/core/load'

export class Testbed extends MadisonAddon {
  private __dataIsGot: boolean = false
  /**
   * 缓存微服务列表
   */
  private __microservices: Microservice[] = []
  /**
   * id与实例微服务映射
   */
  private __microservicesMap: Map<number, Microservice> = new Map()
  /**
   * 缓存testbed列表
   */
  private __testbeds: Reactive<Map<number, TestbedRow>> = reactive(new Map())
  /** 检查testbed是否需要创建或者删除的计时器 */
  private __testbedCorDTimer: NodeJS.Timeout | null = null
  /** 正在创建的testbedids */
  private __testbedCreatingIds: Set<number> = new Set()
  /** 正在删除的testbedids */
  private __testbedDeletingIds: Set<number> = new Set()
  private __microservicesPromise: DefPromiseHelper = new DefPromiseHelper()
  private __testbedPromise: DefPromiseHelper = new DefPromiseHelper()
  private __loadTemplatePromise: DefPromiseHelper = new DefPromiseHelper()

  private __maxTestbeds = ref(0)
  private __usedTestbeds = ref(0)

  get microservices() {
    return Array.from(this.__microservices)
  }

  get testbeds() {
    return computed(() => Array.from(this.__testbeds.values()))
  }

  get maxTestbeds() {
    return computed(() => this.__maxTestbeds.value)
  }

  get usedTestbeds() {
    return computed(() => this.__usedTestbeds.value)
  }

  get canCreate() {
    return computed(() => this.__usedTestbeds.value < this.__maxTestbeds.value)
  }

  get waitingForMicroservices() {
    return this.__microservicesPromise.promise
  }

  get waitingForTestbeds() {
    return this.__testbedPromise.promise
  }

  get waitingForLoadTemplate() {
    return this.__loadTemplatePromise.promise
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.check, this)
  }

  logoutCallback(): void {
    this.__dataIsGot = false
    this.__microservices = []
    this.__microservicesMap.clear()
    this.__maxTestbeds.value = 0
    this.__usedTestbeds.value = 0
    this.__microservicesPromise = new DefPromiseHelper()
    this.__testbedPromise = new DefPromiseHelper()
    this.stopCorDCheck()
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(
      to,
      from,
      true
    )
    if (!can) return
    if (!this.__dataIsGot) {
      const list = [this.getTestbed(), this.getMicroservices(), this.getTestbedQuota()]
      await Promise.all(list)
      this.__dataIsGot = true
    }
  }

  async refresh() {
    await Promise.all([this.getTestbed(), this.getTestbedQuota()])
  }

  private async getTestbed() {
    const res = await getTestbed()
    await this.waitingForMicroservices
    const data = res.data
    let needTimer = false
    data.data.forEach((tData) => {
      const m = this.__microservicesMap.get(tData.microservice_type_id)
      if (m === undefined) return
      if (!this.__testbeds.has(tData.id)) {
        this.__testbeds.set(tData.id, new TestbedRow(tData, m))
      }
      /** 不将创建成功和创建失败的testbed加入轮询 */
      if (tData.install_status !== 'SUCCESS' && tData.install_status !== 'FAILURE') {
        needTimer = true
        this.__testbedCreatingIds.add(tData.id)
      }
      if (tData.delete_status !== null) {
        needTimer = true
        this.__testbedDeletingIds.add(tData.id)
      }
      // const t = this.__testbeds.get(tData.id)
      // if (!t) return
      // /** 需要更新的数据 */
      // t.loaded = tData.is_loaded
      // if (t.loadId === null || tData.load_id === null) t.loadId = tData.load_id ? new LoadItem(tData.load_id, 'SUCCESS') : null
    })
    /** 检查是否需要启动定时器 */
    if (needTimer) {
      this.startCorDCheck()
    }
    this.__testbedPromise.resolve()
  }

  private async getTestbedQuota() {
    const res = await getTestbedQuota()
    const data = res.data
    console.log('[getTestbedQuota]', data.data)
    this.__maxTestbeds.value = data.data.max_testbeds
    this.__usedTestbeds.value = data.data.used_testbeds
  }

  private async getMicroservices() {
    const res = await getMicroservices()
    const data = res.data
    data.data.forEach((mData) => {
      const m = new Microservice(mData)
      this.__microservices.push(m)
      this.__microservicesMap.set(mData.id, m)
    })
    this.__microservicesPromise.resolve()
  }

  /**
   * 检查testbed创建和删除情况
   */
  private startCorDCheck() {
    if (this.__testbedCorDTimer) clearTimeout(this.__testbedCorDTimer)
    const func = async () => {
      const createPromises = Array.from(this.__testbedCreatingIds.values()).map((id) => getInstallRes({ testbedId: id }))
      const createIds = Array.from(this.__testbedCreatingIds.values())
      const deletePromises = Array.from(this.__testbedDeletingIds.values()).map((id) => getDeleteRes({ testbedId: id }))
      const deleteIds = Array.from(this.__testbedDeletingIds.values())
      const res = await Promise.allSettled([
        ...createPromises,
        ...deletePromises
      ])
      let refresh = false
      res.forEach((item, index) => {
        if (item.status === 'fulfilled') {
          const status = item.value.data.data.status
          if (index < createIds.length) {
            const id = createIds[index]
            const testbed = this.__testbeds.get(id)
            if (testbed) testbed.setInstallStatus(status)
            if (status === 'SUCCESS') {
              this.__testbedCreatingIds.delete(id)
              refresh = true
            }
            if (status === 'FAILURE') {
              message(`${id} 创建失败`)
              this.__testbedCreatingIds.delete(id)
              refresh = true
            }
          } else {
            const i = index - createIds.length
            const id = deleteIds[i]
            const testbed = this.__testbeds.get(id)
            if (testbed) testbed.setDeleteStatus(status)
            if (status === 'SUCCESS') {
              this.__testbedDeletingIds.delete(id)
              this.__testbeds.delete(id)
              refresh = true
            }
            if (status === 'FAILURE') {
              this.__testbedDeletingIds.delete(id)
              message(`${id} 删除失败`)
              refresh = true
            }
          }
        }
      })
      const size = this.__testbedCreatingIds.size + this.__testbedDeletingIds.size
      if (refresh) {
        this.refresh()
      } else if (size > 0) this.__testbedCorDTimer = setTimeout(() => this.startCorDCheck(), 10000)
    }
    func()
  }

  private stopCorDCheck() {
    if (this.__testbedCorDTimer !== null) clearInterval(this.__testbedCorDTimer)
  }

  async createTestbed(options: CreateTestbedOptions): Promise<boolean> {
    if (this.__usedTestbeds.value >= this.__maxTestbeds.value) return false
    const res = await createTestbed(options)
    const data = res.data
    // msg
    if (data.code === 0) {
      this.stopCorDCheck()
      await this.refresh()
    }
    return data.code === 0
  }

  async deleteTestbed(testbedId: number): Promise<boolean> {
    const res = await deleteTestbed({ testbedId })
    const data = res.data
    if (data.code === 0) {
      this.stopCorDCheck()
      await this.refresh()
    }
    return data.code === 0
  }
}
