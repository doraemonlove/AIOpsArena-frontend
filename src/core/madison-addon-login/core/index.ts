import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { LoginState } from '../types'
import type { LoginOptions, RetrieveOptions } from '../types'
import { loginByEmail, loginByUsername, retrieve } from './api'
import {
  code,
  setToken,
  getToken,
  localGet,
  localSet,
  messageUseI18n,
  removeToken,
  localDel
} from '@/core/madison/utils'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { ref } from 'vue'

export class Login extends MadisonAddon {
  static readonly TYPE_KEY = 'LOGIN_TYPE'
  static readonly LOGIN_KEY = 'LOGIN_K'
  static readonly LOGIN_PASSWORD = 'LOGIN_P'
  static readonly USER_ID_KEY = 'LOGIN_UID'
  static readonly DISPLAY_NAME_KEY = 'LOGIN_DN'

  private __state: LoginState = LoginState.READY
  private __loginPromise: DefPromiseHelper = new DefPromiseHelper()
  private __isLogin = ref(false)
  private __pageWantToGo: RouteLocationNormalized | null = null

  get state() {
    return this.__state
  }

  get waitingForLogin() {
    return this.__loginPromise.promise
  }

  get logged() {
    return this.__isLogin
  }

  get displayName() {
    return this.getStoredDisplayName()
  }

  constructor(madison: Madison) {
    super(madison)
    this.initializeFromStorage()

    madison.routerPromise.addPrecheck(this.precheck, this)
    /** 最先运行登录检查 */
    madison.routerPromise.addCheck(this.check, this, -999999)
  }

  logoutCallback(): void {}

  /**
   * 登录
   * @param options
   * @returns
   */
  async login(options?: LoginOptions): Promise<boolean> {
    if (this.__state === LoginState.LOGGED) return true
    if (!options) {
      if (this.restoreLoginFromToken()) {
        return true
      }

      const type = localGet(Login.TYPE_KEY, 'username')
      const loginKey = localGet(Login.LOGIN_KEY, '')
      const passwordEncrypted = localGet(Login.LOGIN_PASSWORD, '')
      if (
        !type ||
        !loginKey ||
        !passwordEncrypted ||
        !['username', 'email'].includes(type) ||
        loginKey === '' ||
        passwordEncrypted === ''
      ) {
        this.__state = LoginState.FAILURE
        this.__loginPromise.resolve()
        /**
         * 不提供options原则上仅用于this.check方法
         * 用于测试自动登录是否成功
         * 不做message的提示
         */
        return false
      }
      const nType = type as 'username' | 'email'
      const passwordDecrypted = code.CryptoJS.decrypt(passwordEncrypted)
      options = {
        type: nType,
        key: loginKey,
        password: passwordDecrypted
      }
    }
    const passwordEncrypted = code.CryptoJS.encrypt(options.password)
    const res =
      options.type === 'username' ? await loginByUsername(options) : await loginByEmail(options)
    const data = res.data
    if (!data || data.code !== 0) {
      this.messageI18n('Visitor.Login.Failure')
      this.__state = LoginState.FAILURE
      this.__loginPromise.resolve()
      this.__loginPromise = new DefPromiseHelper()
      return false
    }
    this.messageI18n('Visitor.Login.Success', 'success')
    /** set token */
    setToken(data.data.token)
    localSet(Login.TYPE_KEY, options.type)
    localSet(Login.LOGIN_KEY, options.key)
    localSet(Login.LOGIN_PASSWORD, passwordEncrypted)
    const displayName = this.resolveDisplayName(data.data as unknown as Record<string, unknown>, options.key)
    localSet(Login.DISPLAY_NAME_KEY, displayName)
    const normalizedUserId = this.resolveLoginUserId(data.data as unknown as Record<string, unknown>)
    if (normalizedUserId) {
      localSet(Login.USER_ID_KEY, normalizedUserId)
    } else {
      localDel(Login.USER_ID_KEY)
    }
    this.__state = LoginState.LOGGED
    this.__isLogin.value = true
    this.__loginPromise.resolve()
    return true
  }

  toLoginFromPage() {
    if (this.__state !== LoginState.LOGGED) return
    if (this.__pageWantToGo) {
      this.__madison.routerPromise.router.push(this.__pageWantToGo)
      this.__pageWantToGo = null
    } else {
      this.__madison.routerPromise.router.push({
        name: 'home'
      })
    }
  }

  /**
   * 返回true时需要进行路由跳转
   * @returns
   */
  logout(): boolean {
    if (this.__state === LoginState.LOGGED) {
      this.__state = LoginState.LOGOUT
      this.__loginPromise = new DefPromiseHelper()
      this.__isLogin.value = false
      removeToken()
      localSet(Login.LOGIN_KEY, '')
      localSet(Login.LOGIN_PASSWORD, '')
      localDel(Login.USER_ID_KEY)
      localDel(Login.DISPLAY_NAME_KEY)
      this.__madison.emit('logout')
      return true
    }
    return false
  }

  precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (this.__state === LoginState.LOGOUT) {
      this.__state = LoginState.READY
      return ['redirect', { name: to.name, replace: true }]
    }
  }

  /**
   * 挂载到routerPromise的检查函数
   * @param to
   * @param from
   * @param next
   * @returns
   */
  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (to.name === 'login' || to.name === 'register' || to.name === 'retrieve') return
    if (this.__state === LoginState.READY) {
      /** 尝试登录 */
      const res = await this.login()
      if (res) return
      this.__pageWantToGo = to
      return { name: 'login' }
    }
    if (this.__state === LoginState.LOGGED) return
    if (this.__state === LoginState.FAILURE) {
      this.__pageWantToGo = to
      return { name: 'login' }
    }
  }

  async retrieve(options: RetrieveOptions): Promise<boolean> {
    const res = await retrieve(options)
    const data = res.data
    if (data.code !== 0) {
      this.messageI18n('Visitor.Retrieve.Failure')
    } else {
      this.messageI18n('Visitor.Retrieve.Success', 'success')
    }
    return data.code === 0
  }

  private resolveUserIdFromToken(token: string): string {
    if (!token || token.split('.').length < 2) return ''

    try {
      const payload = token.split('.')[1]
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
      const decoded = decodeURIComponent(
        atob(padded)
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      )
      const data = JSON.parse(decoded) as Record<string, unknown>
      return this.extractUserIdFromPayload(data)
    } catch (_) {
      return ''
    }
  }

  private normalizeUserId(value: unknown): string {
    if (value === undefined || value === null) return ''
    return String(value).trim()
  }

  private normalizeDisplayName(value: unknown): string {
    if (value === undefined || value === null) return ''
    return String(value).trim()
  }

  private getStoredDisplayName() {
    const stored = this.normalizeDisplayName(localGet(Login.DISPLAY_NAME_KEY, ''))
    if (stored) return stored
    return this.normalizeDisplayName(localGet(Login.LOGIN_KEY, ''))
  }

  private resolveDisplayName(payload: Record<string, unknown>, fallback: string) {
    const directCandidate =
      payload.nickname ||
      payload.username ||
      payload.user_name ||
      payload.name

    const normalizedDirect = this.normalizeDisplayName(directCandidate)
    if (normalizedDirect) return normalizedDirect

    const nestedSources = [payload.user, payload.data, payload.profile]
    for (const source of nestedSources) {
      if (!source || typeof source !== 'object') continue
      const candidate =
        (source as Record<string, unknown>).nickname ||
        (source as Record<string, unknown>).username ||
        (source as Record<string, unknown>).user_name ||
        (source as Record<string, unknown>).name
      const normalized = this.normalizeDisplayName(candidate)
      if (normalized) return normalized
    }

    return this.normalizeDisplayName(fallback)
  }

  private resolveLoginUserId(payload: Record<string, unknown>) {
    const normalizedDirect = this.extractUserIdFromPayload(payload)
    if (normalizedDirect) return normalizedDirect

    const token = typeof payload.token === 'string' ? payload.token : ''
    return this.resolveUserIdFromToken(token)
  }

  private extractUserIdFromPayload(payload: Record<string, unknown>) {
    const directCandidate =
      payload.user_id ||
      payload.userId ||
      payload.uid ||
      payload.id ||
      payload.sub

    const normalizedDirect = this.normalizeUserId(directCandidate)
    if (normalizedDirect) return normalizedDirect

    const nestedSources = [payload.user, payload.data, payload.profile]
    for (const source of nestedSources) {
      if (!source || typeof source !== 'object') continue
      const candidate =
        (source as Record<string, unknown>).user_id ||
        (source as Record<string, unknown>).userId ||
        (source as Record<string, unknown>).uid ||
        (source as Record<string, unknown>).id ||
        (source as Record<string, unknown>).sub
      const normalized = this.normalizeUserId(candidate)
      if (normalized) return normalized
    }

    return ''
  }

  private restoreLoginFromToken(): boolean {
    const token = getToken()
    if (!token) return false

    const storedLoginKey = this.normalizeDisplayName(localGet(Login.LOGIN_KEY, ''))
    const displayName = this.getStoredDisplayName() || storedLoginKey
    if (displayName) {
      localSet(Login.DISPLAY_NAME_KEY, displayName)
    } else {
      localDel(Login.DISPLAY_NAME_KEY)
    }

    const normalizedUserId = this.resolveUserIdFromToken(token)
    if (normalizedUserId) {
      localSet(Login.USER_ID_KEY, normalizedUserId)
    } else {
      localDel(Login.USER_ID_KEY)
    }

    this.__state = LoginState.LOGGED
    this.__isLogin.value = true
    this.__loginPromise.resolve()
    return true
  }

  private initializeFromStorage() {
    if (this.restoreLoginFromToken()) {
      return
    }

    const loginKey = localGet(Login.LOGIN_KEY, '') || ''
    const passwordEncrypted = localGet(Login.LOGIN_PASSWORD, '') || ''
    if (loginKey && passwordEncrypted) {
      this.__state = LoginState.READY
      return
    }

    this.__state = LoginState.FAILURE
    this.__loginPromise.resolve()
  }
}
