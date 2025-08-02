import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import {
  createDataset,
  deleteDataset,
  getCollectStatus,
  getDownloadURL,
  getUploadStatus,
  interruptCollect,
  queryDataset,
  updateDatasetVisible,
  uploadDataset
} from './api'
import {
  computed,
  reactive,
  ref,
  type ComputedRef,
  type Reactive,
  type Ref
} from 'vue'
import { DatasetIns } from './dataset'
import { DatasetStatus, type CreateDatasetOptions } from '../types'
import type { Madison } from '@/core/madison/core'
import { createLoopQuery } from '@/core/madison/utils'
import type { AxiosResponse } from 'axios'
import type { MadisonApiRes } from '@/core/madison/types'

export class Dataset extends MadisonAddon {
  private __dataIsGotten = false
  private __datasets: Reactive<Map<number, DatasetIns>> = reactive(new Map())
  public publicDatasets: ComputedRef<DatasetIns[]> = computed(() => {
    return Array.from(this.__datasets.values()).filter((item) => !item.canDelete)
  })
  public privateDatasets: ComputedRef<DatasetIns[]> = computed(() => {
    return Array.from(this.__datasets.values()).filter((item) => item.canDelete)
  })
  private __stop: (() => void) | null = null
  private __datasetStopFuncs: Map<number, () => void> = new Map()

  private __refreshTimer: NodeJS.Timeout | null = null
  private readonly __refreshInterval: number = 5
  private __refreshing: Ref<boolean> = ref(false)
  private __refreshTime: Ref<number> = ref(0)
  canRefresh: ComputedRef<boolean> = computed(() => {
    return this.__refreshTime.value === 0 && this.__refreshing.value === false
  })

  get refreshTime(): ComputedRef<number> {
    return computed(() => this.__refreshTime.value)
  }

  constructor(madison: Madison) {
    super(madison)

    this.__madison.routerPromise.addCheck(this.check, this)
  }

  logoutCallback(): void {
    this.__dataIsGotten = false
    this.__datasets.clear()
    if (this.__refreshTimer) clearInterval(this.__refreshTimer)
    this.__refreshTime.value = 0
    if (this.__stop) this.__stop()
    Array.from(this.__datasetStopFuncs.values()).forEach((item) => item())
    this.__datasetStopFuncs.clear()
    this.__refreshing.value = false
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
    const func = this.queryDataset.bind(this) as unknown as () => Promise<
      AxiosResponse<MadisonApiRes<void>, any>
    >
    const { stop } = createLoopQuery(
      {},
      func,
      () => false,
      () => {},
      () => {},
      () => {},
      30000
    )
    this.__stop = stop
    this.__dataIsGotten = true
  }

  private async queryDataset() {
    const res = await queryDataset()
    const data = res.data
    if (data.code === 0) {
      const datasets = data.data
      const keys = new Set(this.__datasets.keys())
      datasets.forEach((item) => {
        const id = item.id
        keys.delete(id)
        if (this.__datasets.has(id)) {
          this.__datasets.get(id)!.update(item)
        } else {
          this.__datasets.set(id, new DatasetIns(item))
          this.init(id)
        }
      })
      keys.forEach((id) => {
        this.__datasets.delete(id)
      })
    }
  }

  async refresh() {
    this.__refreshTime.value = this.__refreshInterval
    this.__refreshing.value = true
    await this.queryDataset()
    this.__refreshing.value = false
    if (this.__refreshTimer) clearInterval(this.__refreshTimer)

    const func = () => {
      this.__refreshTime.value--
      if (this.__refreshTime.value === 0) {
        if (this.__refreshTimer) clearInterval(this.__refreshTimer)
      }
    }

    this.__refreshTimer = setInterval(func, 1000)
  }

  async deleteDataset(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined) return
    /** 不是自己的数据集 */
    if (!dataset.canDelete) return
    let res: any
    if (
      dataset.collectStatus !== DatasetStatus.SUCCESS &&
      dataset.collectStatus !== DatasetStatus.FAILURE
    ) {
      /** collect未完成 */
      const stop = this.__datasetStopFuncs.get(datasetId)
      if (stop) stop()
      res = await interruptCollect({ datasetId })
    } else if (
      dataset.uploadStatus === DatasetStatus.NONEXISTENT ||
      dataset.uploadStatus === DatasetStatus.SUCCESS ||
      dataset.uploadStatus === DatasetStatus.FAILURE
    ) {
      /** 没upload或者upload完成 */
      const stop = this.__datasetStopFuncs.get(datasetId)
      if (stop) stop()
      res = await deleteDataset({ datasetId })
    }
    if (res.data.code === 0) {
      this.messageI18n('Dataset.Delete.Success', 'success')
    } else {
      this.messageI18n('Dataset.Delete.Failure')
    }
    await this.queryDataset()
  }

  async updateDatasetVisible(datasetId: number, visible: string) {
    const res = await updateDatasetVisible({ datasetId, visible })
    if (res.data.code === 0) {
      this.messageI18n('Dataset.ChangeVisibility.Success', 'success')
    } else {
      this.messageI18n('Dataset.ChangeVisibility.Failure')
    }
    await this.queryDataset()
  }

  async createDataset(options: CreateDatasetOptions) {
    const res = await createDataset(options)
    if (res.data.code === 0) {
      this.messageI18n('Dataset.Create.Success', 'success')
    } else {
      this.messageI18n('Dataset.Create.Failure')
    }
    await this.queryDataset()
  }

  private init(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || !dataset.canDelete) return
    if (
      dataset.collectStatus !== DatasetStatus.SUCCESS &&
      dataset.collectStatus !== DatasetStatus.FAILURE
    ) {
      this.waitingForCollect(datasetId)
    }
    if (
      dataset.collectStatus === DatasetStatus.SUCCESS &&
      dataset.uploadStatus !== DatasetStatus.NONEXISTENT &&
      dataset.uploadStatus !== DatasetStatus.SUCCESS &&
      dataset.uploadStatus !== DatasetStatus.FAILURE
    ) {
      this.waitingForUpload(datasetId)
    }
    if (dataset.uploadStatus === DatasetStatus.SUCCESS) {
      this.getUrl(datasetId)
    }
  }

  private waitingForCollect(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || !dataset.canDelete) return
    const { stop } = createLoopQuery(
      { datasetId },
      getCollectStatus,
      (res) =>
        res.data.status === DatasetStatus.SUCCESS || res.data.status === DatasetStatus.FAILURE,
      (res) => {
        const data = res.data
        if (res.code !== 0) {
          dataset.collectStatus = DatasetStatus.FAILURE
          return
        }
        dataset.collectStatus = data.status
      },
      () => {
        dataset.collectStatus = DatasetStatus.FAILURE
      },
      () => {
        dataset.collectStatus = DatasetStatus.FAILURE
      },
      1000
    )
    this.__datasetStopFuncs.set(datasetId, stop)
  }

  private waitingForUpload(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || !dataset.canDelete) return
    if (dataset.uploadStatus === DatasetStatus.SUCCESS) {
      this.getUrl(datasetId)
      return
    }
    const { stop } = createLoopQuery(
      { datasetId },
      getUploadStatus,
      (res) =>
        res.data.status === DatasetStatus.SUCCESS || res.data.status === DatasetStatus.FAILURE,
      (res) => {
        const data = res.data
        dataset.uploading = false
        if (res.code !== 0) {
          dataset.uploadStatus = DatasetStatus.FAILURE
          return
        }
        dataset.uploadStatus = data.status
        if (dataset.uploadStatus === DatasetStatus.SUCCESS) {
          this.getUrl(datasetId)
        }
      },
      () => {
        dataset.uploadStatus = DatasetStatus.FAILURE
      },
      () => {
        dataset.uploadStatus = DatasetStatus.FAILURE
      },
      1000
    )
    this.__datasetStopFuncs.set(datasetId, stop)
  }

  private async getUrl(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || dataset.url) return
    dataset.getURLing = true
    const res = await getDownloadURL({ datasetId })
    dataset.url = res.data.data.download_url
    dataset.getURLing = false
  }

  async upload(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || !dataset.canDelete) return
    if (dataset.uploadStatus !== DatasetStatus.SUCCESS) await uploadDataset({ datasetId })
    this.waitingForUpload(datasetId)
  }

  async downloadPublic(datasetId: number) {
    const dataset = this.__datasets.get(datasetId)
    if (dataset === undefined || dataset.canDelete) return
    this.getUrl(datasetId)
  }
}
