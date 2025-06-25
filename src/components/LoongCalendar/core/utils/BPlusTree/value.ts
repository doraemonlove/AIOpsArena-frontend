export class BPlusTreeValueNode<V extends { id: string | number}> {
  private __values: Map<string | number, V> = new Map()

  get size() {
    return this.__values.size
  }

  values() {
    return this.__values.values()
  }

  insert(value: V) {
    this.__values.set(value.id, value)
  }

  remove(value: V) {
    return this.__values.delete(value.id)
  }
}
