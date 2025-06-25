import type { BPlusTree } from '.'
import { BPlusTreeLeafNode } from './leaf'
import { BPlusTreeValueNode } from './value'

export class BPlusTreeNode<V extends { id: string | number}> {
  type = 'NODE'
  private __maxNodeCount: number
  keys: number[] = []
  values: (BPlusTreeNode<V> | BPlusTreeLeafNode<V>)[] = []

  get canRemove() {
    return this.keys.length > (this.__maxNodeCount + 1) >> 1
  }

  constructor(maxNodeCount: number, entries?: [number[], (BPlusTreeNode<V> | BPlusTreeLeafNode<V>)[]]) {
    this.__maxNodeCount = maxNodeCount
    if (entries) {
      this.keys = entries[0]
      this.values = entries[1]
    }
  }

  getFirstLeaf(): BPlusTreeLeafNode<V> {
    const value = this.values[0]
    if (value instanceof BPlusTreeLeafNode) {
      return value
    } else {
      return value.getFirstLeaf()
    }
  }

  maxKey(): number {
    return this.keys[this.keys.length - 1]
  }

  insert(key: number, value: V, bptree: BPlusTree<V>): BPlusTreeNode<V> | boolean {
    const keyI = this.keys.findIndex(item => item >= key)
    let res
    let node
    /** 不存在比key大的数据 */
    if (keyI === -1) {
      node = this.values[this.values.length - 1]
      res = node.insert(key, value, bptree)
      this.keys[this.values.length - 1] = node.maxKey()
    } else {
      node = this.values[keyI]
      res = node.insert(key, value, bptree)
      this.keys[keyI] = node.maxKey()
    }
    if (typeof res === 'boolean') return res
    /** 子进行了split，这里需要增加节点 */
    const splicePos = keyI === -1 ? this.keys.length : keyI + 1
    this.keys.splice(splicePos, 0, res.maxKey())
    this.values.splice(splicePos, 0, res)
    if (splicePos > 0 && this.values[splicePos - 1] instanceof BPlusTreeLeafNode && res instanceof BPlusTreeLeafNode) {
      /** 如果前一个节点也是叶子节点，则将前一个节点的next指向当前节点 */
      (this.values[splicePos - 1] as BPlusTreeLeafNode<V>).next = res
      res.prev = this.values[splicePos - 1] as BPlusTreeLeafNode<V>
    } else if (splicePos < this.keys.length - 1 && this.values[splicePos + 1] instanceof BPlusTreeLeafNode && res instanceof BPlusTreeLeafNode) {
      /** 如果后一个节点也是叶子节点，则将当前节点的next指向后一个节点 */
      res.next = (this.values[splicePos + 1] as BPlusTreeLeafNode<V>);
      (this.values[splicePos + 1] as BPlusTreeLeafNode<V>).prev = res
    } else if (splicePos === this.keys.length && res instanceof BPlusTreeLeafNode) {
      /** 是最后一个节点 */
      res.next = null
    } else if (splicePos === 0 && res instanceof BPlusTreeLeafNode) {
      res.prev = null
    }
    /** 检查长度 */
    const length = this.keys.length
    if (length > this.__maxNodeCount) {
      const center = length >> 1
      const newKeys = this.keys.slice(center)
      const newValues = this.values.slice(center)
      this.keys =  this.keys.slice(0, center)
      this.values = this.values.slice(0, center)
      const newNode = new BPlusTreeNode(this.__maxNodeCount, [newKeys, newValues])
      /** 返回右侧节点 */
      return newNode
    }
    return true
  }

  remove(key: number, value: V, bpnode?: BPlusTreeNode<V>, i?: number): boolean {
    const keyI = this.keys.findIndex(item => item >= key)
    if (keyI === -1) return false
    const ins = this.values[keyI]
    const res = ins.remove(key, value, this, keyI)
    if (!res) return res
    if (bpnode === undefined || i === undefined) return true
    /** 检查长度 */
    const length = this.keys.length
    /** 如果小于此，则检查是否可以合并 */
    if (length <= ((this.__maxNodeCount + 1) >> 1) - 1) {
      /** 检查前一个 */
      if (i > 0) {
        const prev = bpnode.values[i - 1] as BPlusTreeNode<V>
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
        const next = bpnode.values[i + 1] as BPlusTreeNode<V>
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
        const prev = bpnode.values[i - 1] as BPlusTreeNode<V>
        prev.keys = prev.keys.concat(this.keys)
        prev.values = prev.values.concat(this.values)
        bpnode.keys[i - 1] = bpnode.values[i - 1].maxKey()
      } else {
        /** 合并到右边 */
        const next = bpnode.values[i + 1] as BPlusTreeNode<V>
        next.keys = this.keys.concat(next.keys)
        next.values = this.values.concat(next.values)
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

  getPrevAndNext(key: number) {
    const i = this.keys.findIndex(item => item === key)
    return [i - 1, i + 1]
  }

  search(key: number): BPlusTreeValueNode<V> | undefined {
    const keyI = this.keys.findIndex(item => item >= key)
    if (keyI !== -1) return this.values[keyI].search(key)
    return undefined
  }

  searchFirstBigger(key: number): BPlusTreeLeafNode<V> | undefined {
    const keyI = this.keys.findIndex(item => item >= key)
    if (keyI !== -1 && this.values[keyI] instanceof BPlusTreeLeafNode) return this.values[keyI]
    if (keyI !== -1 && this.values[keyI] instanceof BPlusTreeNode) return this.values[keyI].searchFirstBigger(key)
    return undefined
  }
}
