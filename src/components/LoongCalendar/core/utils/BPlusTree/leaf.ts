import type { BPlusTree } from '.'
import type { BPlusTreeNode } from './node'
import { BPlusTreeValueNode } from './value'

export class BPlusTreeLeafNode<V extends { id: string | number}> {
  type = 'LEAF'
  private __maxNodeCount: number
  keys: number[] = []
  values: BPlusTreeValueNode<V>[] = []
  prev: null | BPlusTreeLeafNode<V> = null
  next: null | BPlusTreeLeafNode<V> = null

  get canRemove() {
    return this.keys.length > (this.__maxNodeCount + 1) >> 1
  }

  constructor(maxNodeCount: number, entries?: [number[], BPlusTreeValueNode<V>[]]) {
    this.__maxNodeCount = maxNodeCount
    if (entries) {
      this.keys = entries[0]
      this.values = entries[1]
    }
  }

  getFirstLeaf(): BPlusTreeLeafNode<V> {
    return this
  }

  maxKey(): number {
    return this.keys[this.keys.length - 1]
  }

  insert(key: number, value: V, bptree: BPlusTree<V>): BPlusTreeLeafNode<V> | boolean {
    const keyI = this.keys.findIndex(item => key === item)
    let ins
    /** 数据不存在 */
    if (keyI === -1) {
      ins = new BPlusTreeValueNode<V>()
      /** 查询插入位置 */
      const tindex = this.keys.findIndex(item => item >= key)
      const index = tindex === -1 ? this.keys.length : tindex
      this.keys.splice(index, 0, key)
      this.values.splice(index, 0, ins)
    } else {
      ins = this.values[keyI]
    }
    /** 插入数据 */
    ins.insert(value)
    /** 检查长度 */
    const length = this.keys.length
    if (length > this.__maxNodeCount) {
      const center = length >> 1
      const newKeys = this.keys.slice(center)
      const newValues = this.values.slice(center)
      this.keys =  this.keys.slice(0, center)
      this.values =  this.values.slice(0, center)
      const newNode = new BPlusTreeLeafNode(this.__maxNodeCount, [newKeys, newValues])
      newNode.next = this.next
      if (this.next) this.next.prev = newNode
      this.next = newNode
      newNode.prev = this
      /** 返回右侧节点 */
      return newNode
    }
    return true
  }

  remove(key: number, value: V, bpnode?: BPlusTreeNode<V>, i?: number): boolean {
    const keyI = this.keys.findIndex(item => key === item)
    if (keyI === -1) return false
    const ins = this.values[keyI]
    const res = ins.remove(value)
    if (!res) return res
    /** 如果value已经空，则移除value */
    if (ins.size === 0) {
      this.keys.splice(keyI, 1)
      this.values.splice(keyI, 1)
    }
    if (bpnode === undefined || i === undefined) return true
    /** 检查长度 */
    const length = this.keys.length
    /** 如果小于此，则检查是否可以合并 */
    if (length <= ((this.__maxNodeCount + 1) >> 1) - 1) {
      /** 检查前一个 */
      if (i > 0) {
        const prev = bpnode.values[i - 1] as BPlusTreeLeafNode<V>
        /** 可以借最大的 */
        if (prev.canRemove) {
          const pkey = prev.keys[prev.keys.length - 1]
          const pvalue = prev.values[prev.keys.length - 1]
          prev.keys.length = prev.keys.length - 1
          prev.values.length = prev.values.length - 1
          this.keys.unshift(pkey)
          this.values.unshift(pvalue)
          bpnode.keys[i - 1] = bpnode.values[i - 1].maxKey()
          return true
        }
      }
      /** 检查后一个 */
      if (i < bpnode.keys.length - 1) {
        const next = bpnode.values[i + 1] as BPlusTreeLeafNode<V>
        /** 可以借最小的 */
        if (next.canRemove) {
          const nkey = next.keys[0]
          const nvalue = next.values[0]
          next.keys = next.keys.slice(1)
          next.values = next.values.slice(1)
          this.keys.push(nkey)
          this.values.push(nvalue)
          bpnode.keys[i] = bpnode.values[i].maxKey()
          return true
        }
      }
      /** 都不可以借，只能进行合并 */
      if (i > 0) {
        /** 合并到左边 */
        const prev = bpnode.values[i - 1] as BPlusTreeLeafNode<V>
        prev.keys = prev.keys.concat(this.keys)
        prev.values = prev.values.concat(this.values)
        prev.next = this.next
        if (this.next) this.next.prev = prev
        bpnode.keys[i - 1] = bpnode.values[i - 1].maxKey()
      } else {
        /** 合并到右边 */
        const next = bpnode.values[i + 1] as BPlusTreeLeafNode<V>
        next.keys = this.keys.concat(next.keys)
        next.values = this.values.concat(next.values)
        next.prev = this.prev
        if (this.prev) this.prev.next = next
        bpnode.keys[i + 1] = bpnode.values[i + 1].maxKey()
      }
      /** 从父节点删除该节点 */
      bpnode.keys.splice(i, 1)
      bpnode.values.splice(i, 1)
      return true
    }
    bpnode.keys[i] = bpnode.values[i].maxKey()
    return res
  }

  search(key: number): BPlusTreeValueNode<V> | undefined {
    const keyI = this.keys.findIndex(item => item === key)
    if (keyI !== -1) return this.values[keyI]
    return undefined
  }

  searchFirstBigger(key: number): BPlusTreeLeafNode<V> | undefined {
    return this
  }

  getBigger(key: number): BPlusTreeValueNode<V>[] {
    const keyI = this.keys.findIndex(item => item >= key)
    if (keyI !== -1) return this.values.slice(keyI)
    return this.values
  }
}
