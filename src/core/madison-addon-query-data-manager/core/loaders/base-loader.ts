export abstract class BaseLoader<P, D> {
  readonly id: string
  readonly type: string

  private  __options: P
  private __meta: any
  private __data: D | null = null

  constructor(id: string, type: string, options: P, meta: any) {
    this.id = id
    this.type = type
    this.__meta = meta
    this.__options = options
  }

  abstract load(): Promise<D>
}
