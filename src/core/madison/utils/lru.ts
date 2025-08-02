export class LRUCache<K, V> extends Map {
  capacity: number
  deleteCallback: ((key: K, value: V) => void) | null

  constructor(capacity?: number, deleteCallback?: (key: K, value: V) => void) {
    super()
    this.capacity = capacity || 100
    this.deleteCallback = deleteCallback || null
  }

  set(key: K, value: V): this {
    if (this.has(key)) {
      this.delete(key)
    } else {
      if (this.size >= this.capacity) {
        this.delete(this.keys().next().value)
      }
    }
    return super.set(key, value)
  }

  get(key: K): V | undefined {
    if (this.has(key)) {
      const value = super.get(key)
      super.delete(key)
      super.set(key, value)
      return value
    } else return undefined
  }

  delete(key: any): boolean {
    if (this.deleteCallback && this.has(key)) this.deleteCallback(key, super.get(key) as V)
    return super.delete(key)
  }
}
