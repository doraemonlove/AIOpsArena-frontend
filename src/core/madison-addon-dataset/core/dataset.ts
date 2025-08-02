import { DatasetStatus, type QueryDatasetResItem } from '../types'

export class DatasetIns {
  readonly id: number
  readonly name: string
  collectStatus: DatasetStatus
  uploadStatus: DatasetStatus
  readonly createPerson: string
  readonly createTime: string
  readonly namespace: string
  readonly description: string
  canDelete: boolean
  visible: boolean

  uploading: boolean = false
  getURLing: boolean = false
  url: string | null = null

  constructor(item: QueryDatasetResItem) {
    this.id = item.id
    this.name = item.dataset_name
    this.collectStatus = item.collect_status || DatasetStatus.NONEXISTENT
    this.uploadStatus = item.upload_status || DatasetStatus.NONEXISTENT
    this.createPerson = item.create_person
    this.createTime = item.create_time
    this.namespace = item.namespace
    this.description = item.description
    this.canDelete = item.can_delete
    this.visible = item.visible === 'True'
  }

  update(item: QueryDatasetResItem) {
    this.collectStatus = item.collect_status || DatasetStatus.NONEXISTENT
    this.uploadStatus = item.upload_status || DatasetStatus.NONEXISTENT
    this.visible = item.visible === 'True'
  }
}
