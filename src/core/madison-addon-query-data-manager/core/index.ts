import { MadisonAddon } from '@/core/madison/core/addon-base'
import { LRUCache } from '@/core/madison/utils'
import type { QueryData } from './data'

export class QueryDataManager extends MadisonAddon {
  private __queryingData: Map<string, QueryData> = new Map()
  private __data: LRUCache<string, QueryData> = new LRUCache()

  pushQueryingData(data: QueryData) {
    this.__queryingData.set(data.id, data)
  }

  removeQueryingData(id: string) {
    return this.__queryingData.delete(id)
  }

  getData(id: string): QueryData | undefined {
    return this.__data.get(id)
  }

  removeData(id: string) {
    return this.__data.delete(id)
  }

  queryCompleted(data: QueryData) {
    this.__queryingData.delete(data.id)
    this.__data.set(data.id, data)
  }

  logoutCallback(): void {

  }
}
