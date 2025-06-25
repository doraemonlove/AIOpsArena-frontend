import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { createLoad, deleteLoad, getLoadParams } from './api'
import { LoadItem, LoadParams } from './load'
import type { CreateLoadOptions } from '../types'
import type { Madison } from '@/core/madison/core'
import type { Testbed } from '@/core/madison-addon-testbed/core/testbed'

export class Load extends MadisonAddon {
  private __loadParamsMap: Map<number, LoadParams> = new Map()

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.check, this)
  }

  logoutCallback(): void {
    this.__loadParamsMap.clear()
  }

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'testbed')
    if (!can) return

    await this.__madison.testbed.waitingForTestbeds

    const microserviceTypeIdList = Array.from(new Set(this.__madison.testbed.testbeds.value.map((item) => item.microserviceTypeId)))

    const psList = microserviceTypeIdList.map(async (id) => {
      if (this.__loadParamsMap.has(id)) return
      const res = await getLoadParams({ microserviceTypeId: id })
      const data = res.data
      if (data.code === 0) {
        this.__loadParamsMap.set(id, new LoadParams(data.data))
      }
      return
    })

    await Promise.all(psList)
  }

  async createLoad(options: CreateLoadOptions, testbed: Testbed): Promise<boolean> {
    const res = await createLoad(options)
    const data = res.data
    if (data.code === 0) {
      testbed.loadIns.getInstallResult(data.data.load_id)
      return true
    }
    return false
  }

  async deleteLoad(loadId: number, namespace: string, testbed: Testbed) {
    const res = await deleteLoad({ loadId })
    const data = res.data
    if (data.code === 0) {
      testbed.loadIns.getDeleteResult()
      return true
    }
  }

  async getLoadParams(microserviceTypeId: number) {
    if (!this.__loadParamsMap.has(microserviceTypeId)) {
      const res = await getLoadParams({ microserviceTypeId })
      const data = res.data
      if (data.code === 0) {
        this.__loadParamsMap.set(microserviceTypeId, new LoadParams(data.data))
      }
    }
    return this.__loadParamsMap.get(microserviceTypeId)
  }

  has(microserviceTypeId: number) {
    return this.__loadParamsMap.has(microserviceTypeId)
  }
}
