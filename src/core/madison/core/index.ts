import EventEmitter from 'eventemitter3'
import i18n from '@/assets/i18n'

import { RouterPromise } from './router-promise'

import { MadisonI18n } from '@/core/madison-addon-i18n'
import { Login } from '@/core/madison-addon-login'
import { Register } from '@/core/madison-addon-register'
import type { MadisonEvents } from '../types'
import { Testbed } from '@/core/madison-addon-testbed'
import { Trace } from '@/core/madison-addon-trace/core'
import type { Router } from 'vue-router'
import { Namespace } from '@/core/madison-addon-namespace'
import { Traces } from '@/core/madison-addon-traces'
import { Logs } from '@/core/madison-addon-logs'
import { Theme } from '@/core/madison-addon-theme'
import { Metrics } from '@/core/madison-addon-metrics'
import { Metric } from '@/core/madison-addon-metric'
import { Load } from '@/core/madison-addon-load'
import { Dataset } from '@/core/madison-addon-dataset'
import { FaultManager } from '@/core/madison-addon-fault-manager/core'

const i18nMsg = {
  'en-US': {
    Success: 'Success!',
    RuntimeError: 'RuntimeError'
  },
  'zh-CN': {
    Success: '成功!',
    RuntimeError: '运行时出错'
  }
}

export class Madison extends EventEmitter<MadisonEvents> {
  private static instance: Madison | null = null
  static getInstance(router?: Router): Madison {
    if (!Madison.instance && router) {
      Madison.instance = new Madison(router)
    }
    return Madison.instance as Madison
  }
  static getI18nMessage(): any {
    /**
     *
     * @param obj 确保存在getI18nMessage静态方法
     */
    function getAll(obj: any) {
      obj.forEach((ins: any) => {
        const msg = ins.getI18nMessage()
        if (msg) {
          Object.assign(i18nMsg['en-US'], msg['en-US'])
          Object.assign(i18nMsg['zh-CN'], msg['zh-CN'])
        }
      })
    }
    const list: any[] = []
    getAll(list)
    return i18nMsg
  }

  readonly routerPromise: RouterPromise

  readonly theme: Theme

  readonly i18n: MadisonI18n
  readonly login: Login
  readonly register: Register
  readonly testbed: Testbed
  readonly load: Load

  readonly namespace: Namespace
  readonly traces: Traces
  readonly trace: Trace
  readonly logs: Logs
  readonly metrics: Metrics
  readonly metric: Metric

  readonly dataset: Dataset

  readonly faultManager: FaultManager

  constructor(router: Router) {
    super()
    this.routerPromise = new RouterPromise(router)

    this.theme = new Theme(this)

    this.i18n = new MadisonI18n(i18n, this)
    this.login = new Login(this)
    this.register = new Register(this)
    this.testbed = new Testbed(this)
    this.load = new Load(this)

    this.namespace = new Namespace(this)
    this.traces = new Traces(this)
    this.trace = new Trace(this)
    this.logs = new Logs(this)
    this.metrics = new Metrics(this)
    this.metric = new Metric(this)

    this.dataset = new Dataset(this)

    this.faultManager = new FaultManager(this)
  }
}

export function useMadison() {
  return Madison.getInstance()
}
