import { LoadItemStatus, type GetParamsRes } from '../types'
import { getDeleteResult, getInstallResult, getLoadInfo } from './api'

export class LoadParams {
  private data: Record<string, number | string>

  get keys() {
    return Object.keys(this.data)
  }

  get types() {
    return Object.values(this.data).map((v) => typeof v)
  }

  constructor(data: GetParamsRes) {
    this.data = data
  }

  get(key: string) {
    return this.data[key]
  }
}

export class LoadItem {
  id: number = -1
  status: LoadItemStatus = LoadItemStatus.UNKNOWN
  installStatus: string | null = null
  deleteStatus: string | null = null
  private __timer: NodeJS.Timeout | null = null
  constructor(id: number | false, query: true | LoadItemStatus = true) {
    if (id === false) {
      this.status = LoadItemStatus.NONEXISTENT
      return
    }
    this.id = id
    this.status = query === true ? LoadItemStatus.QUERYING : query
    if (query === true) {
      this.startPolling()
    }
  }

  getInstallResult(id?: number) {
    this.status = LoadItemStatus.QUERYING
    this.id = id || this.id

    const func = async () => {
      const res = await getInstallResult(this.id)
      const data = res.data
      if (data.code === 0) {
        const status = data.data.status
        this.installStatus = status
        if (status === 'SUCCESS') {
          /** 安装完成 */
          this.status = LoadItemStatus.RUNNING
        } else {
          /** 正在安装 */
          this.status = LoadItemStatus.LOADING
        }
      }
      if (this.status === LoadItemStatus.RUNNING) return
      setTimeout(func, 500)
    }

    func()
  }

  getDeleteResult(id?: number) {
    this.status = LoadItemStatus.QUERYING
    this.id = id || this.id

    const func = async () => {
      const res = await getDeleteResult(this.id)
      const data = res.data
      if (data.code === 0) {
        const status = data.data.status
        this.deleteStatus = status
        if (status === 'SUCCESS') {
          /** 删除完成 */
          this.status = LoadItemStatus.NONEXISTENT
        } else {
          /** 正在删除 */
          this.status = LoadItemStatus.DELETING
        }
      } else {
        console.error(data.message)
      }
      if (this.status === LoadItemStatus.NONEXISTENT) return
      setTimeout(func, 500)
    }

    func()
  }

  private startPolling() {
    if (this.status === LoadItemStatus.RUNNING || this.status === LoadItemStatus.NONEXISTENT) return
    if (this.__timer) clearTimeout(this.__timer)

    const func = async () => {
      const res = await getLoadInfo(this.id)
      const data = res.data
      if (data.code === 0) {
        const sData = data.data[0]
        if (sData.delete_status !== null) {
          /** 在删除状态 */
          this.deleteStatus = sData.delete_status
          if (sData.delete_status === 'SUCCESS') {
            /** 删除完成 */
            this.status = LoadItemStatus.NONEXISTENT
          } else {
            /** 正在删除 */
            this.status = LoadItemStatus.DELETING
          }
        } else if (sData.install_status !== null) {
          /** 在安装状态 */
          this.installStatus = sData.install_status
          if (sData.install_status === 'SUCCESS') {
            /** 安装完成 */
            this.status = LoadItemStatus.RUNNING
          } else {
            /** 正在安装 */
            this.status = LoadItemStatus.LOADING
          }
        }
      }
      if (this.status === LoadItemStatus.NONEXISTENT || this.status === LoadItemStatus.RUNNING) return
      this.__timer = setTimeout(func, 1000)
    }
    func()
  }
}
