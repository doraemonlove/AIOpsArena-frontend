import type {
  RouteLocationNormalized,
  NavigationGuardNext,
  RouteLocationRaw,
  Router
} from 'vue-router'
import type { RouterPromiseSyncFuncRes } from '../../types'

type WaitFunc = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => Promise<RouteLocationRaw | void>

type SyncFunc = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => RouterPromiseSyncFuncRes

type CheckFuncData<T> = {
  func: WaitFunc
  context: T
  level: number
}

type PrecheckFuncData<T> = {
  func: SyncFunc
  context: T
  level: number
}

type PostcheckFuncData<T> = {
  func: SyncFunc
  context: T
  level: number
}

export class RouterPromise {
  static getQueryData(to: RouteLocationNormalized, queryList: string[]): [string, string | undefined][] {
    const res: [string, string | undefined][] = []
    queryList.forEach((key) => {
      res.push([key, to.query[key] as string | undefined])
    })
    return res
  }
  static checkQueryData(queryData: [string, string | undefined][], checkList: [string, 'must' | 'empty'][]): false;
  static checkQueryData(queryData: [string, string | undefined][], checkList: [string, 'must' | 'empty' | 'func'][], func: (key: string, value: string | undefined) => boolean): false;
  static checkQueryData(queryData: [string, string | undefined][], checkList: [string, 'must' | 'empty' | 'func'][], func?: (key: string, value: string | undefined) => boolean): false {
    return false
  }

  private __promises: Array<Promise<RouteLocationRaw | void>> = []
  private __checkFunctions: Array<CheckFuncData<unknown>> = []
  private __precheckFunctions: Array<PrecheckFuncData<unknown>> = []
  private __postcheckFunctions: Array<PostcheckFuncData<unknown>> = []

  readonly router: Router

  constructor(router: Router) {
    this.router = router
  }

  /**
   * 注册一个每次路由跳转前都会执行的函数
   * 返回一个Promise代表是否需要加载数据
   *
   * @param func 函数
   * @param context 函数上下文
   * @param level 运行顺序，越大越靠后
   */
  addCheck<T>(func: WaitFunc, context: T, level: number = 0) {
    const fd: CheckFuncData<T> = {
      func,
      context,
      level
    }
    this.__checkFunctions.push(fd)
    this.__checkFunctions.sort((a, b) => a.level - b.level)
  }

  /**
   * 预检查函数
   * @param func
   * @param context
   * @param level
   */
  addPrecheck<T>(func: SyncFunc, context: T, level: number = 0) {
    const fd: PrecheckFuncData<T> = {
      func,
      context,
      level
    }
    this.__precheckFunctions.push(fd)
    this.__precheckFunctions.sort((a, b) => a.level - b.level)
  }

  /**
   * 后检查函数
   * @param func
   * @param context
   * @param level
   */
  addPostcheck<T>(func: SyncFunc, context: T, level: number = 0) {
    const fd: PostcheckFuncData<T> = {
      func,
      context,
      level
    }
    this.__postcheckFunctions.push(fd)
    this.__postcheckFunctions.sort((a, b) => a.level - b.level)
  }

  /**
   * 移除一个注册的函数
   *
   * @param func 函数
   * @param context 函数上下文
   */
  removeCheck<T>(func: WaitFunc, context: T) {
    this.__checkFunctions = this.__checkFunctions.filter(
      (fd) => fd.func !== func || fd.context !== context
    )
  }

  removePrecheck<T>(func: SyncFunc, context: T) {
    this.__precheckFunctions = this.__precheckFunctions.filter(
      (fd) => fd.func !== func || fd.context !== context
    )
  }

  removePostcheck<T>(func: SyncFunc, context: T) {
    this.__postcheckFunctions = this.__postcheckFunctions.filter(
      (fd) => fd.func !== func || fd.context !== context
    )
  }

  /**
   * 为下次路由跳转添加一个需要等待的Promise
   *
   * @param p Promise对象
   */
  addPromise(p: Promise<RouteLocationRaw | void>) {
    this.__promises.push(p)
  }

  /**
   * 路由跳转前守卫触发
   * 接收跳转信息
   * 返回Promise等待跳转
   *
   * @param to 路由信息
   * @param from 路由信息
   * @param next next
   */
  async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): Promise<boolean> {
    if (to.name === 'error' || to.name === 'home') return true
    this.__checkFunctions.forEach((fd) => {
      this.__promises.push(fd.func.call(fd.context, to, from))
    })
    //
    // 这里可能会抛出错误
    //
    try {
      const resList = await Promise.all(this.__promises)
      console.log(resList)
      for (let i = 0; i < resList.length; i++) {
        const res = resList[i]
        if (res) {
          console.log(res)
          this.__promises = []
          next(res)
          console.log('next')
          return false
        }
      }
    } catch (err) {
      throw new Error('Error ' + err)
    }
    return true
  }

  /**
   * 路由进入触发，在wait之前
   * @param to
   * @param from
   * @param next
   * @returns
   */
  precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): boolean {
    const resList: RouterPromiseSyncFuncRes[] = []
    this.__precheckFunctions.forEach((fd) => {
      resList.push(fd.func.call(fd.context, to, from))
    })
    return this.syncFuncCheck(resList, next)
  }

  /**
   * 路由跳转后守卫触发
   * 清空所有添加的Promise
   *
   */
  postcheck(to: RouteLocationNormalized, from: RouteLocationNormalized) {
    this.__postcheckFunctions.forEach((fd) => {
      fd.func.call(fd.context, to, from)
    })
    this.__promises = []
  }

  private syncFuncCheck(resList: RouterPromiseSyncFuncRes[], next: NavigationGuardNext): boolean {
    for (let i = 0; i < resList.length; i++) {
      const res = resList[i]
      if (res) {
        if (res[0] === 'success') {
          continue
        } else if (res[0] === 'redirect') {
          next(res[1])
          return false
        }
      }
    }
    return true
  }
}
