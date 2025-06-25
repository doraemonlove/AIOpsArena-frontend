export class LRUCache<K, V> extends Map<K, V> {
  capacity: number
  constructor(capacity?: number) {
    super()
    this.capacity = capacity || 100
  }
  set(key: K, value: V): this {
    if (this.has(key)) {
      this.delete(key)
    } else {
      if (this.size >= this.capacity) {
        const k = this.keys().next().value as K
        this.delete(k)
      }
    }
    return super.set(key, value)
  }

  get(key: K): V | undefined {
    if (this.has(key)) {
      const value = super.get(key) as V
      this.delete(key)
      super.set(key, value)
      return value
    } else return undefined
  }
}
