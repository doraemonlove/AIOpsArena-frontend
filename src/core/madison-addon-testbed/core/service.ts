export class Service {
  readonly name: string
  private __calls: string[]

  constructor(name: string, calls: string[]) {
    this.name = name
    this.__calls = calls
  }

  get calls() {
    return Array.from(this.__calls)
  }
}

export class TestbedService extends Service {
  readonly instances: number

  constructor(name: string, calls: string[], instances: number) {
    super(name, calls)
    this.instances = instances
  }
}
