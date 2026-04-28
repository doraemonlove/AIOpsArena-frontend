import { ElMessage } from 'element-plus'
import { Madison } from '../core'

import code_ from './code'
export const code = code_
export * from './stroage'
export * from './token'
export * from './request'
export * from './lru'
export * from './common'

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
  // console.warn('Madison: 未能匹配到msg:', msgId)
}

export function isNumber(value: string | string[]) {
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

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // 月份从0开始，需要+1
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
