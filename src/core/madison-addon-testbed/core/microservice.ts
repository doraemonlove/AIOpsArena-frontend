import type { MicroserviceItem } from '../types'
import { Service } from './service'

export class Microservice {
  readonly name: string
  readonly path: string
  readonly id: number
  readonly frontend: string
  readonly loadGenerator: string
  readonly allowReplica: boolean
  readonly isAvailable: boolean

  private __servicesMap: Map<string, Service> = new Map()

  get services() {
    return Array.from(this.__servicesMap.values())
  }

  constructor(data: MicroserviceItem) {
    this.name = data.name
    this.path = data.path
    this.id = data.id
    this.frontend = data.frontend
    this.loadGenerator = data.loadgenerator
    this.allowReplica = data.allow_replica
    this.isAvailable = data.is_available

    this.init(data)
  }

  private init(data: MicroserviceItem) {
    const services = data.topology.services
    for (const serviceName in services) {
      const item = services[serviceName]
      this.__servicesMap.set(serviceName, new Service(serviceName, item.calls))
    }
  }
}
