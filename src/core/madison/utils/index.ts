import { ElMessage } from 'element-plus'
import { Madison } from '../core'

import code_ from './code'
export const code = code_
export * from './stroage'
export * from './token'
export * from './request'
export * from './lru'

/**
 * 显示提示框
 * @param msg 提示信息
 * @param type 提示类型（默认error）
 * @param duration 提示时长（默认3000(ms)）
 */
export function message(
  msg: string,
  type?: 'error' | 'success' | 'info' | 'warning',
  duration?: number
) {
  type = type || 'error'
  duration = duration || (type === 'error' ? 4000 : 3000)
  ElMessage({
    message: msg,
    type: type,
    duration: duration
  })
}

/**
 * 加入i18n的信息提示框，负责给接口返回的信息输出
 * @param msgId i18nid
 * @param code response code
 * @param type
 * @param duration
 */
export function messageUseI18n(
  msgId: string,
  code: number,
  type?: 'error' | 'success' | 'info' | 'warning',
  duration?: number
) {
  type = type || (code === 0 ? 'success' : 'error')
  duration = duration || (type === 'error' ? 4000 : 3000)
  const msgType = msgId.split('.').at(-1) || ''
  const msgApi = msgId.split('.').at(1) || ''
  const msgs: string[] = ['Madison.' + msgApi + '.' + msgType, 'Madison.' + msgType]
  const t = Madison.getInstance().i18n.getT()
  const te = Madison.getInstance().i18n.getTe()
  for (const msg of msgs) {
    if (te(msg)) {
      ElMessage({
        message: t(msg),
        type: type,
        duration: duration
      })
      return
    }
  }
  //
  // 未能匹配到msg
  //
  console.warn('Madison: 未能匹配到msg:', msgId)
}

export function isNumber(value: string | string[]) {
  console.log(value)
  if (Array.isArray(value)) {
    return value.every((v) => !Number.isNaN(Number(v)))
  }
  return !Number.isNaN(Number(value))
}

/**
 * 深拷贝对象
 * @param target 深拷贝对象
 * @returns 深拷贝结果
 */
export function deepClone(target: any, stack?: WeakMap<any, any>) {
  function getType(obj: any): string {
    type TypeMap = {
      [property: string]: string
    }
    const map: TypeMap = {
      '[object Boolean]': 'boolean',
      '[object Number]': 'number',
      '[object String]': 'string',
      '[object Function]': 'function',
      '[object Array]': 'array',
      '[object Date]': 'date',
      '[object RegExp]': 'regExp',
      '[object Undefined]': 'undefined',
      '[object Null]': 'null',
      '[object Object]': 'object'
    }
    if (obj instanceof Element) {
      return 'element'
    }
    return map[Object.prototype.toString.call(obj)] || 'unknown'
  }

  const type = getType(target)
  if (type === 'array' || type === 'object') {
    // 检查循环引用并返回其对应的克隆
    stack || (stack = new WeakMap())
    const stacked = stack.get(target)
    if (stacked) {
      return stacked
    }
    // 复杂数据类型 递归实现
    //
    if (type === 'array') {
      const _clone: Array<any> = []
      target.forEach((element: any) => {
        _clone.push(deepClone(element, stack))
      })
      stack.set(target, _clone)
      return _clone
    }
    if (type === 'object') {
      type TypeClone = {
        [property: string]: any
      }
      const _clone: TypeClone = {}
      for (const key in target) {
        if (Object.hasOwnProperty.call(target, key)) {
          const element = target[key]
          _clone[key] = deepClone(element, stack)
        }
      }
      stack.set(target, _clone)
      return _clone
    }
  } else {
    // 基础数据类型 直接返回
    //
    return target
  }
}

/**
 * 防抖函数
 * @param func 待执行的函数
 * @param delay 防抖时间 200
 * @returns Function
 */
export function debounce<T extends (...args: any[]) => void>(func: T, delay: number = 200): T {
  let timerId: NodeJS.Timeout | null = null
  return function (this: ThisParameterType<T>, ...args: any[]) {
    if (timerId) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  } as T
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

export function getDatesForNextSevenDays(startDate: Date): Date[] {
  // 创建一个数组来存储日期
  const dates: Date[] = []

  // 将输入的日期复制一份，避免修改原始日期
  let currentDate = new Date(startDate)

  // 循环七次，每次添加一天
  for (let i = 0; i < 7; i++) {
    // 将当前日期的副本添加到数组中
    dates.push(new Date(currentDate))

    // 为当前日期加一天
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }

  return dates
}

export abstract class MadisonMapItem<K> {
  abstract rGet(key: K): void
  abstract rSet(key: K): void
  abstract rDelete(key: K): void
}

export abstract class MadisonMap<K, V extends MadisonMapItem<K>> extends Map<K, V> {
  override get(key: K) {
    const v = super.get(key)
    if (v) v.rGet(key)
    return v
  }

  override set(key: K, value: V): this {
    value.rSet(key)
    return super.set(key, value)
  }

  override delete(key: K): boolean {
    const v = super.get(key)
    if (v) v.rDelete(key)
    return super.delete(key)
  }
}

export abstract class MadisonItemMap<K, V extends MadisonMapItem<K>> extends Map<K, V> {
  override get(key: K) {
    const v = super.get(key)
    if (v) v.rGet(key)
    return v
  }

  override set(key: K, value: V): this {
    value.rSet(key)
    return super.set(key, value)
  }

  override delete(key: K): boolean {
    const v = super.get(key)
    if (v) v.rDelete(key)
    return super.delete(key)
  }

  abstract rGet(key: K): void
  abstract rSet(key: K): void
  abstract rDelete(key: K): void
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // 月份从0开始，需要+1
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
