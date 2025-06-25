export class BinaryHeap<T> {
  __heap: T[] = []
  private __compareFn: (a: T, b: T) => boolean
  private __unique: boolean
  private __uniqueSet: Set<T> = new Set()

  constructor(__compareFn: (a: T, b: T) => boolean, unique: boolean = false) {
    this.__compareFn = __compareFn
    this.__unique = unique
  }

  /**
   * 获取父节点的索引
   * @param index 当前位置
   * @returns 当前位置的父节点索引
   */
  private parentIndex(index: number): number {
    return Math.floor((index - 1) / 2)
  }

  /**
   * 获取左子节点的索引
   * @param index 当前位置
   * @returns 当前位置的左子节点索引
   */
  private leftChildIndex(index: number): number {
    return 2 * index + 1
  }

  /**
   * 获取右子节点的索引
   * @param index 当前位置
   * @returns 当前位置的右子节点索引
   */
  private rightChildIndex(index: number): number {
    return 2 * index + 2
  }

  /**
   * 上浮操作：将当前节点向上调整到合适的位置
   * @param index 当前位置
   */
  private siftUp(index: number): void {
    let currentIndex = index
    while (currentIndex > 0) {
      const parentIndex = this.parentIndex(currentIndex)
      if (this.__compareFn(this.__heap[currentIndex], this.__heap[parentIndex])) {
        // 如果当前节点应该排在父节点前面，交换它们
        [this.__heap[currentIndex], this.__heap[parentIndex]] = [this.__heap[parentIndex], this.__heap[currentIndex]]
        currentIndex = parentIndex
      } else {
        break
      }
    }
  }

  /**
   * 下沉操作：将当前节点向下调整到合适的位置
   * @param index 当前位置
   */
  private siftDown(index: number): void {
    let currentIndex = index
    while (true) {
      const leftChildIndex = this.leftChildIndex(currentIndex)
      const rightChildIndex = this.rightChildIndex(currentIndex)
      let preferredIndex = currentIndex

      if (leftChildIndex < this.__heap.length && this.__compareFn(this.__heap[leftChildIndex], this.__heap[preferredIndex])) {
        preferredIndex = leftChildIndex
      }

      if (rightChildIndex < this.__heap.length && this.__compareFn(this.__heap[rightChildIndex], this.__heap[preferredIndex])) {
        preferredIndex = rightChildIndex
      }

      if (preferredIndex !== currentIndex) {
        // 如果当前节点应该排在子节点后面，交换它们
        [this.__heap[currentIndex], this.__heap[preferredIndex]] = [this.__heap[preferredIndex], this.__heap[currentIndex]]
        currentIndex = preferredIndex
      } else {
        break
      }
    }
  }

  /**
   * 插入元素
   * @param value 插入的元素
   */
  public insert(value: T): void {
    if (this.__unique && this.__uniqueSet.has(value)) return
    if (this.__unique) this.__uniqueSet.add(value)
    this.__heap.push(value)
    this.siftUp(this.__heap.length - 1)
  }

  /**
   * 移除元素
   * @param value 移除的元素
   * @returns
   */
  public remove(value: T): boolean {
    if (this.__unique && !this.__uniqueSet.has(value)) return false
    if (this.__unique) this.__uniqueSet.delete(value)
    const index = this.__heap.indexOf(value)
    if (index === -1) return false
    this.__heap[index] = this.__heap[0]
    const tu = this.__unique
    this.__unique = false
    this.extractTop()
    this.__unique = tu
    return true
  }

  /**
   * 重新计算堆顶的元素
   */
  public rebuild(): void {
    this.siftDown(0)
  }

  /**
   * 删除并返回堆顶元素
   * @returns 堆顶元素
   */
  public extractTop(): T | undefined {
    if (this.__heap.length === 0) {
      return undefined
    }

    const topElement = this.__heap[0]
    const lastElement = this.__heap.pop()

    if (this.__heap.length > 0) {
      this.__heap[0] = lastElement!
      this.siftDown(0)
    }
    if (this.__unique) this.__uniqueSet.delete(topElement)
    return topElement
  }

  /**
   * 获取堆顶元素
   * @returns 堆顶元素
   */
  public peek(): T | undefined {
    return this.__heap[0]
  }

  /**
   * 获取堆的大小
   * @returns 堆的大小
   */
  public size(): number {
    return this.__heap.length
  }

  /**
   * 清空堆
   */
  public clear(): void {
    this.__uniqueSet.clear()
    this.__heap = []
  }
}

export function getTopItems<T>(heap: BinaryHeap<T>, nums: number = 10): T[] {
  const res: T[] = []
  for (let i = 0; i < nums; i++) {
    const t = heap.extractTop()
    if (t === undefined) return res
    else res.push(t)
  }
  return res
}
