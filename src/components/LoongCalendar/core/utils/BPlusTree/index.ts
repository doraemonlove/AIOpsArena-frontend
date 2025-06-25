import { BPlusTreeLeafNode } from './leaf'
import { BPlusTreeNode } from './node'
import { BPlusTreeValueNode } from './value'

export class BPlusTree<V extends { id: string | number}> {
  private __root: BPlusTreeNode<V> | BPlusTreeLeafNode<V> | null = null
  private __maxNodeCount: number = 32

  constructor(maxNodeCount: number = 32) {
    this.__maxNodeCount = Math.max(3, maxNodeCount)
  }

  clear() {
    this.__root = null
  }

  getFirstLeaf(): BPlusTreeLeafNode<V> | null {
    return this.__root?.getFirstLeaf() ?? null
  }

  insert(key: number, value: V) {
    if (this.__root === null) {
      this.__root = new BPlusTreeLeafNode(this.__maxNodeCount)
    }
    const res = this.__root.insert(key, value, this)
    if (typeof res === 'boolean') return res
    this.__root = new BPlusTreeNode(this.__maxNodeCount, [[this.__root.maxKey(), res.maxKey()], [this.__root, res]])
    return true
  }

  remove(key: number, value: V): boolean {
    if (this.__root === null) return false
    const res = this.__root.remove(key, value)
    if (this.__root.values.length === 1 && !(this.__root.values[0] instanceof BPlusTreeValueNode)) this.__root = this.__root.values[0]
    return res
  }

  search(key: number): BPlusTreeValueNode<V> | undefined {
    if (this.__root) return this.__root.search(key)
    return undefined
  }

  searchFirstBigger(key: number): BPlusTreeLeafNode<V> | undefined {
    if (this.__root) return this.__root.searchFirstBigger(key)
    return undefined
  }
}
