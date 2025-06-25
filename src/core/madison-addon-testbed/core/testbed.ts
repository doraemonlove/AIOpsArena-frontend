import { LoadItem } from '@/core/madison-addon-load/core/load'
import type { TestbedItem } from '../types'
import type { Microservice } from './microservice'
import { TestbedService } from './service'
import { Testbed as TestbedManager } from './index'

export class Testbed {
  readonly id: number
  readonly name: string
  readonly description: string
  readonly createdPersonId: number
  readonly createdTime: string
  readonly microserviceTypeId: number
  readonly namespace: string
  loadingDisplay: boolean = false
  private __installStatus: string = ''
  private __deleteStatus: string = ''
  loaded: boolean
  loadIns: LoadItem

  private __servicesMap: Map<string, TestbedService> = new Map()
  private __microservice: Microservice

  get installStatus() {
    return this.__installStatus
  }

  get deleteStatus() {
    return this.__deleteStatus
  }

  get microservice() {
    return this.__microservice.name
  }

  get localeCreatedTime() {
    return new Date(this.createdTime).toLocaleString()
  }

  constructor(data: TestbedItem, microservice: Microservice) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.createdPersonId = data.created_person_id
    this.createdTime = data.created_time
    this.microserviceTypeId = data.microservice_type_id
    this.namespace = data.namespace
    this.__installStatus = data.install_status
    this.__deleteStatus = data.delete_status
    this.loaded = data.is_loaded
    this.loadIns = new LoadItem(data.load_id === null ? false : data.load_id)

    this.__microservice = microservice

    this.init(data)
  }

  private init(data: TestbedItem) {
    if (this.__installStatus !== 'SUCCESS' && this.__installStatus !== 'FAILURE' && this.__deleteStatus !== null) {
      this.loadingDisplay = true
    }
    const services = data.topology.services
    for (const serviceName in services) {
      const item = services[serviceName]
      this.__servicesMap.set(
        serviceName,
        new TestbedService(serviceName, item.calls, item.instances)
      )
    }
  }

  setInstallStatus(status: string) {
    this.__installStatus = status
    if (status === 'SUCCESS' || status === 'FAILURE') {
      this.loadingDisplay = false
    }
  }

  setDeleteStatus(status: string) {
    this.__deleteStatus = status
    if (status === 'SUCCESS' || status === 'FAILURE') {
      this.loadingDisplay = false
    }
  }
}
