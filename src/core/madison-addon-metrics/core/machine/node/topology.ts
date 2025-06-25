export class Topology {
  readonly name: string
  private __instances: string[]
  readonly id: string

  get instances() {
    return Array.from(this.__instances)
  }

  constructor(name: string, instances: string[], namespace: string) {
    this.name = name
    this.__instances = instances
    this.id = namespace + '.' + name
  }

  setInstances(instances: string[]) {
    this.__instances = [...new Set([...this.__instances, ...instances])].sort((i1, i2) =>
      i1.localeCompare(i2)
    )
  }
}
