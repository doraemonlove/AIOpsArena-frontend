import type { QueryDatasetResItem } from '../types'

export class DatasetIns {
  readonly id: number
  readonly name: string
  readonly status: string
  readonly createPerson: string
  readonly createTime: string
  readonly namespace: string
  readonly description: string
  readonly canDelete: boolean
  readonly visible: boolean

  constructor(item: QueryDatasetResItem) {
    this.id = item.id
    this.name = item.dataset_name
    this.status = item.status
    this.createPerson = item.create_person
    this.createTime = item.create_time
    this.namespace = item.namespace
    this.description = item.description
    this.canDelete = item.can_delete
    this.visible = item.visible === 'True'
  }
}
