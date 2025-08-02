import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import { ref, type Ref, watch, type WatchHandle } from 'vue'
import { computed, type ComputedRef } from 'vue'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { DefPromiseHelper } from '@/core/madison/core/promise-helper'
import { checkNS } from './api'

export class Namespace extends MadisonAddon {
  private __dataIsGot: boolean = false

  private __namespaces: ComputedRef<string[]> = computed(() => {
    return Array.from(
      new Set(this.__madison.testbed.testbeds.value.map((item) => item.namespace))
    )
  })
  /** .../namespace/... */
  private __paramNamespace: Ref<string> = ref('')
  private __queryParamNamespace: Ref<string> = ref('')
  /** .../?namespace=xxx */
  private __queryNamespace: Ref<string> = ref('')
  private __queryQueryNamespace: Ref<string> = ref('')

  private __queryNamespaceCheckPromise: DefPromiseHelper = new DefPromiseHelper()
  private __paramNamespaceCheckPromise: DefPromiseHelper = new DefPromiseHelper()
  private __namespacePromise: DefPromiseHelper = new DefPromiseHelper()

  private __checkedNamespace: Map<string, boolean> = new Map()

  private __nowParamNamespaceIsValid: boolean = false
  private __nowQueryNamespaceIsValid: boolean = false

  private __nowParamNamespaceIsValidRef: Ref<boolean> = ref(false)
  private __nowQueryNamespaceIsValidRef: Ref<boolean> = ref(false)

  get paramNamespace() {
    return computed(() => this.__paramNamespace.value)
  }

  get queryNamespace() {
    return computed(() => this.__queryNamespace.value)
  }

  get queryParamNamespace() {
    return computed(() => this.__queryParamNamespace.value)
  }

  get queryQueryNamespace() {
    return computed(() => this.__queryQueryNamespace.value)
  }

  get namespaces() {
    return computed(() => Array.from(this.__namespaces.value))
  }

  get waitingForParamNamespaceCheck() {
    return this.__paramNamespaceCheckPromise.promise
  }

  get waitingForQueryNamespaceCheck() {
    return this.__queryNamespaceCheckPromise.promise
  }

  get waitingForNamespaceGet() {
    return this.__namespacePromise.promise
  }

  get paramNamespaceIsValid() {
    return this.__nowParamNamespaceIsValid
  }

  get queryNamespaceIsValid() {
    return this.__nowQueryNamespaceIsValid
  }

  get paramNamespaceIsValidRef() {
    return computed(() => this.__nowParamNamespaceIsValidRef.value)
  }

  get queryNamespaceIsValidRef() {
    return computed(() => this.__nowQueryNamespaceIsValidRef.value)
  }

  constructor(madison: Madison) {
    super(madison)

    watch(this.__namespaces, (newVal, oldVal) => {
      const add = newVal.filter(n => !oldVal.includes(n))
      const remove = oldVal.filter(n => !newVal.includes(n))
      add.forEach(n => {
        this.__checkedNamespace.set(n, true)
      })
      remove.forEach(n => {
        this.__checkedNamespace.delete(n)
      })
    })

    madison.routerPromise.addCheck(this.check, this, -9999)
    madison.routerPromise.addCheck(this.checkNamespace, this, -9999)
    madison.routerPromise.addPrecheck(this.precheckNamespace, this, -9999)
    madison.routerPromise.addPostcheck(this.postcheckNamespace, this, -9999)
  }

  logoutCallback(): void {
    this.__dataIsGot = false
    this.__paramNamespace.value = ''
    this.__queryNamespace.value = ''
  }

  precheckNamespace(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.params.namespace) {
      this.__queryParamNamespace.value = to.params.namespace as string
    } else {
      this.__paramNamespace.value = ''
      this.__queryParamNamespace.value = ''
      this.__nowParamNamespaceIsValid = true
      this.__nowParamNamespaceIsValidRef.value = true
    }
    if (to.query.namespace) {
      this.__queryQueryNamespace.value = to.query.namespace as string
    } else {
      this.__queryNamespace.value = ''
      this.__queryQueryNamespace.value = ''
      this.__nowQueryNamespaceIsValid = true
      this.__nowQueryNamespaceIsValidRef.value = true
    }
    this.__paramNamespaceCheckPromise = new DefPromiseHelper()
    this.__queryNamespaceCheckPromise = new DefPromiseHelper()
  }

  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(
      to,
      from,
      true
    )
    if (!can) return
    if (!this.__dataIsGot) {
      await this.__madison.testbed.waitingForTestbeds
      // this.__namespaces = computed(() => {
      //   return Array.from(
      //     new Set(this.__madison.testbed.testbeds.value.map((item) => item.namespace))
      //   )
      // })
      this.__namespaces.value.forEach((item) => {
        this.__checkedNamespace.set(item, true)
      })
      this.__dataIsGot = true
      this.__namespacePromise.resolve()
    }
  }

  async checkNamespace(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(
      to,
      from,
      true
    )
    if (!can) {
      this.__nowParamNamespaceIsValid = false
      this.__nowQueryNamespaceIsValid = false
      this.__paramNamespaceCheckPromise.resolve()
      this.__queryNamespaceCheckPromise.resolve()
      return
    }
    let namespace = this.__queryParamNamespace.value
    let isValid = await this.checkNamespaceValid(namespace)
    this.__nowParamNamespaceIsValid = isValid
    this.__paramNamespaceCheckPromise.resolve()
    namespace = this.__queryQueryNamespace.value
    isValid = await this.checkNamespaceValid(namespace)
    this.__nowQueryNamespaceIsValid = isValid
    this.__queryNamespaceCheckPromise.resolve()
  }

  async checkNamespaceValid(namespace: string): Promise<boolean> {
    if (namespace === '') return false
    if (this.__checkedNamespace.has(namespace)) {
      return this.__checkedNamespace.get(namespace) as boolean
    }
    const res = await checkNS(namespace)
    const data = res.data
    if (data.code === 0) {
      this.__checkedNamespace.set(namespace, data.data.is_exist)
      return data.data.is_exist
    }
    this.__checkedNamespace.set(namespace, false)
    return false
  }

  /**
   * 在postcheck改变暴露的namespace确保所有的数据都获取完毕
   * @param to
   * @param from
   */
  postcheckNamespace(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    this.__nowParamNamespaceIsValidRef.value = this.__nowParamNamespaceIsValid
    this.__nowQueryNamespaceIsValidRef.value = this.__nowQueryNamespaceIsValid
    if (this.__nowParamNamespaceIsValid) {
      this.__paramNamespace.value = this.__queryParamNamespace.value
    }
    if (this.__nowQueryNamespaceIsValid) {
      this.__queryNamespace.value = this.__queryQueryNamespace.value
    }
  }
}
