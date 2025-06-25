import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { createDataset, deleteDataset, queryDataset, updateDatasetVisible } from './api'
import { computed, reactive, type Reactive } from 'vue'
import { DatasetIns } from './dataset'
import type { CreateDatasetOptions } from '../types'
import type { Madison } from '@/core/madison/core'

export class Dataset extends MadisonAddon {
  private __dataIsGotten = false
  private __publicDatasets: Reactive<Map<number, DatasetIns>> = reactive(new Map())
  private __privateDatasets: Reactive<Map<number, DatasetIns>> = reactive(new Map())

  get publicDatasets() {
    return computed(() => {
      return Array.from(this.__publicDatasets.values())
    })
  }

  get privateDatasets() {
    return computed(() => {
      return Array.from(this.__privateDatasets.values())
    })
  }

  constructor(madison: Madison) {
    super(madison)

    this.__madison.routerPromise.addCheck(this.check, this)
  }

  logoutCallback(): void {
    this.__dataIsGotten = false
    this.__publicDatasets.clear()
    this.__privateDatasets.clear()
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(
      to,
      from,
      (to) => to.matched.find((item) => item.name === 'dataset') !== undefined
    )
    if (!can) return
    if (this.__dataIsGotten) return
    await this.queryDataset()
    this.__dataIsGotten = true
  }

  private async queryDataset() {
    const res = await queryDataset()
    const data = res.data
    if (data.code === 0) {
      const datasets = data.data
      const publicSet: Set<number> = new Set(this.__publicDatasets.keys())
      const privateSet: Set<number> = new Set(this.__privateDatasets.keys())
      datasets.forEach((item) => {
        const id = item.id
        const isUser = item.can_delete
        if (isUser) {
          privateSet.delete(id)
          this.__privateDatasets.set(id, new DatasetIns(item))
        } else {
          publicSet.delete(id)
          this.__publicDatasets.set(id, new DatasetIns(item))
        }
      })
      publicSet.forEach((id) => {
        this.__publicDatasets.delete(id)
      })
      privateSet.forEach((id) => {
        this.__privateDatasets.delete(id)
      })
    }
  }

  async deleteDataset(datasetId: number) {
    await deleteDataset({ datasetId })
    await this.queryDataset()
  }

  async updateDatasetVisible(datasetId: number, visible: string) {
    await updateDatasetVisible({ datasetId, visible })
    await this.queryDataset()
  }

  async createDataset(options: CreateDatasetOptions) {
    await createDataset(options)
    await this.queryDataset()
  }
}
