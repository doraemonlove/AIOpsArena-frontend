import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { MadisonAddon } from '../madison/core/addon-base'
import { ref, type Ref } from 'vue'
import type { RouterPromiseSyncFuncRes } from '../madison/types'
import type { Madison } from '../madison/core'

export class Data extends MadisonAddon {
  private __lastNamespace: Ref<string> = ref('')

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  logoutCallback(): void {
    this.__lastNamespace.value = ''
  }

  precheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'data') return
    if (to.query.namespace === undefined && this.__lastNamespace.value !== '') return ['redirect', { name: 'data', query: { namespace: this.__lastNamespace.value }}]
  }

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'data')
    if (!can) return
    if (to.query.namespace === undefined) {
      await this.__madison.namespace.waitingForNamespaceGet
      const namespaces = this.__madison.namespace.namespaces.value
      if (namespaces.length === 0) return
      return { name: 'data', query: { namespace: namespaces[0] }}
    }
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) return { name: 'data' }
  }

  postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized): RouterPromiseSyncFuncRes {
    if (to.name !== 'data') return
    if (to.query.namespace !== undefined) this.__lastNamespace.value = to.query.namespace as string
  }
}
