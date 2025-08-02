import type { PodTopologyResItem } from '../../../types'

export class Topology {
  readonly data: PodTopologyResItem
  readonly name: string
  readonly calls: string[]
  readonly instances: string[]
  constructor(name: string, data: PodTopologyResItem) {
    this.name = name
    this.data = data
    this.calls = data.calls
    this.instances = data.instances
  }
}
