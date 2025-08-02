import { ScheduleBucketsType } from '../../types'
import type { BPlusTreeLeafNode } from './BPlusTree/leaf'
export * from './BPlusTree'
export * from './LRUCache'
export * from './BinaryHeap'

export function getSundayOfTheWeek(date: Date): Date {
  const tempDate = new Date(date)
  const dayOfWeek = tempDate.getDay()
  tempDate.setDate(tempDate.getDate() - dayOfWeek)
  const day = new Date(tempDate.getTime())
  day.setHours(0, 0, 0, 0)
  return day
}

export function now() {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  return day
}

export function getDate0000(date: Date): Date {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

export function getAllValueBiggerThan<V extends {id: string | number}>(key: number, node: BPlusTreeLeafNode<V>): V[] {
  const res = node.getBigger(key)
  let tnode = node.next
  while (tnode) {
    res.push(...tnode.values)
    tnode = tnode.next
  }
  return res.map((value) => Array.from(value.values())).flat(1)
}

export function calculateDateDifferences(startDate: Date, endDate: Date): { days: number; months: number; weeks: number; years: number } {
  if (endDate < startDate) {
    throw new Error('endDate must be greater than startDate')
  }
  const oneDay = 24 * 60 * 60 * 1000 // 一天的毫秒数
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay)
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth()
  const weeks = Math.ceil(days / 7)
  const years = endDate.getFullYear() - startDate.getFullYear()
  return { days, months, weeks, years }
}

export function checkScheduleCanDisplay(begin: Date, today: Date, type: ScheduleBucketsType, number: number): boolean {
  if (begin > today) return false
  const diff = calculateDateDifferences(begin, today)
  switch (type) {
    case ScheduleBucketsType.DATE:
      return diff.days % (number + 1) === 0
    case ScheduleBucketsType.MONTH:
      return diff.months % (number + 1) === 0
    case ScheduleBucketsType.WEEK:
      return diff.weeks % (number + 1) === 0
    case ScheduleBucketsType.YEAR:
      return diff.years % (number + 1) === 0
  }
}

export type CompareFunction<T> = (a: T, b: T) => boolean;

export function intersection<T>(compareFn: CompareFunction<T>, ...arrays: T[][]): T[] {
  if (arrays.length === 0) {
    return []
  }

  // 获取第一个数组作为基准
  const [firstArray, ...restArrays] = arrays

  // 使用 Set 来存储结果，避免重复
  const resultSet = new Set<T>()

  // 遍历第一个数组
  for (const item of firstArray) {
    let foundInAll = true

    // 检查当前元素是否在其他数组中都存在
    for (const array of restArrays) {
      if (!array.some((otherItem) => compareFn(item, otherItem))) {
        foundInAll = false
        break
      }
    }

    // 如果当前元素在所有数组中都存在，则加入结果集
    if (foundInAll) {
      resultSet.add(item)
    }
  }

  // 将 Set 转换为数组并返回
  return Array.from(resultSet)
}

/**
 * 随机字符串生成函数生成器
 * - 闭包存储map
 * @param characters_ 可选的字符
 * @returns 随机字符串生成函数
 */
export function generateRandomStringBase(characters_?: string) {
  const idMap = new Map()
  idMap.set('', true)
  return function (length = 10) {
    let result = ''
    const length_ = length
    const characters =
      characters_ || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const charactersLength = characters.length

    while (idMap.get(result) === true) {
      for (let i = 0; i < length_; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
    }
    idMap.set(result, true)

    return result
  }
}

/**
 * 节流函数
 * @param func 待执行的函数
 * @param delay 节流时间
 * @returns Function
 */
export function throttle<T extends (...args: any[]) => void>(func: T, delay: number = 200): T {
  let timerId: NodeJS.Timeout | null = null
  let lastExecutedTime = 0
  return function (this: ThisParameterType<T>, ...args: any[]) {
    const currentTime = Date.now()
    const timeSinceLastExecution = currentTime - lastExecutedTime
    if (timeSinceLastExecution >= delay) {
      func.apply(this, args)
      lastExecutedTime = currentTime
    } else {
      if (timerId) {
        clearTimeout(timerId)
      }
      timerId = setTimeout(() => {
        func.apply(this, args)
        lastExecutedTime = Date.now()
      }, delay - timeSinceLastExecution)
    }
  } as T
}

/**
 * 时间字符串转对应秒数
 * @param input 时间字符串
 * @returns 秒数
 */
export function parseTimeToSeconds(input: string): number {
  // 定义时间单位到秒的换算关系
  const timeUnits: Record<string, number> = {
    y: 365 * 24 * 60 * 60, // 一年的秒数
    w: 7 * 24 * 60 * 60, // 一周的秒数
    d: 24 * 60 * 60, // 一天的秒数
    h: 60 * 60, // 一小时的秒数
    m: 60, // 一分钟的秒数
    s: 1 // 一秒
  }

  // 定义时间单位的顺序
  const order = ['y', 'w', 'd', 'h', 'm', 's']
  let lastUnitIndex = -1 // 用于记录上一个时间单位的索引

  // 正则表达式匹配时间单位和对应的数字
  const regex = /(\d+)([ywdhms])/g
  let match
  let totalSeconds = 0

  const set = new Set()

  // 遍历匹配结果
  while ((match = regex.exec(input)) !== null) {
    const [fullMatch, number, unit] = match
    const num = parseInt(number, 10)

    // 如果单位不存在或数字不是有效数字，返回 -1
    if (!(unit in timeUnits) || isNaN(num)) {
      return -1
    }

    // 如果单位前面有，返回 -1
    if (set.has(unit)) return -1
    set.add(unit)

    // 检查时间单位的顺序
    const currentUnitIndex = order.indexOf(unit)
    if (currentUnitIndex < lastUnitIndex) {
      // 当前单位出现在上一个单位之前，顺序错误
      return -1
    }
    lastUnitIndex = currentUnitIndex

    // 累加秒数
    totalSeconds += num * timeUnits[unit]
  }

  // 检查是否匹配了整个字符串
  if (input.replace(regex, '') !== '') {
    return -1
  }

  return totalSeconds
}
