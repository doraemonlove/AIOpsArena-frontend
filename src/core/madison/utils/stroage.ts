/**
 * local 取
 * @param key 键
 * @param defaultValue 默认值
 * @param type 存储类型
 * @returns value
 */
export function localGet<T = string>(
  key: string,
  defaultValue?: any,
  checkFunc?: (value: T) => boolean,
  type?: string
) {
  type = type || 'default'
  type = type.toLocaleLowerCase()
  if (
    defaultValue !== undefined &&
    defaultValue !== null &&
    window.localStorage.getItem(key) === null
  ) {
    localSet(key, defaultValue, type)
  }
  switch (type) {
    case 'default':
      return window.localStorage.getItem(key)
    case 'json':
      return JSON.parse(window.localStorage.getItem(key) || '') as T
    default:
      throw new Error(`不可接受的type:${type}`)
  }
}

/**
 * local 存
 * @param key 键
 * @param value 值
 * @param type 存储类型
 * @returns void
 */
export function localSet(key: string, value: any, type?: string) {
  type = type || 'default'
  type = type.toLocaleLowerCase()
  switch (type) {
    case 'default':
      return window.localStorage.setItem(key, value)
    case 'json':
      return window.localStorage.setItem(key, JSON.stringify(value).toString())
    default:
      throw new Error(`不可接受的type:${type}`)
  }
}

/**
 * local 删
 * @param key 键
 */
export function localDel(key: string) {
  window.localStorage.removeItem(key)
}

/**
 * session 取
 * @param key 键
 * @param defaultValue 默认值
 * @param type 存储类型
 * @returns value
 */
export function sessionGet(key: string, defaultValue?: any, type?: string) {
  type = type || 'default'
  type = type.toLocaleLowerCase()
  if (
    defaultValue !== undefined &&
    defaultValue !== null &&
    window.sessionStorage.getItem(key) === null
  ) {
    sessionSet(key, defaultValue, type)
  }
  switch (type) {
    case 'default':
      return window.sessionStorage.getItem(key)
    case 'json':
      return JSON.parse(window.sessionStorage.getItem(key) || '')
    default:
      throw new Error(`不可接受的type:${type}`)
  }
}

/**
 * session 存
 * @param key 键
 * @param value 值
 * @param type 存储类型
 * @returns void
 */
export function sessionSet(key: string, value: any, type?: string) {
  type = type || 'default'
  type = type.toLocaleLowerCase()
  switch (type) {
    case 'default':
      return window.sessionStorage.setItem(key, value)
    case 'json':
      return window.sessionStorage.setItem(key, JSON.stringify(value).toString())
    default:
      throw new Error(`不可接受的type:${type}`)
  }
}

/**
 * session 删
 * @param key 键
 */
export function sessionDel(key: string) {
  window.sessionStorage.removeItem(key)
}
