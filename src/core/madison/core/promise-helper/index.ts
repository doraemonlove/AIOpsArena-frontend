import EventEmitter from 'eventemitter3'

export enum PromiseHelperState {
  UNINIT,
  WAITING,
  PENDING,
  RESOLVED,
  REJECTED
}

type PromiseHelperMapItem = {
  promise: Promise<void>
  resolve: (value: void | PromiseLike<void>) => void
  reject: (reason?: any) => void
}

export class PromiseHelper extends Map<string, Promise<void>> {
  private ee = new EventEmitter()
  private _corePromiseMap = new Map<string, Promise<void>>()

  private initPromise(id: string) {
    if (!this.has(id)) {
      const p = new Promise<void>((resolve, reject) => {
        const rse = id + '-resolve'
        const rje = id + '-reject'
        const rs = () => {
          resolve()
          this.ee.off(rse, rs)
          this.ee.off(rje, rj)
        }
        const rj = () => {
          reject()
          this.ee.off(rse, rs)
          this.ee.off(rje, rj)
        }
        this.ee.on(rse, rs)
        this.ee.on(rje, rs)
      })
      this.set(id, p)
    }
  }

  getPromise(id: string) {
    this.initPromise(id)
    return this.get(id) as Promise<void>
  }

  setPromise(id: string, promise: Promise<void>) {
    this.initPromise(id)
    this._corePromiseMap.set(id, promise)
    const rse = id + '-resolve'
    const rje = id + '-reject'
    promise
      .then(() => {
        this.ee.emit(rse)
      })
      .catch(() => {
        this.ee.emit(rje)
      })
  }
}

export enum DefPromiseHelperState {
  READY,
  PENDING,
  RESOLVED,
  REJECTED
}

export class DefPromiseHelper {
  private __promise: Promise<void>
  private __ee: EventEmitter
  private __state: DefPromiseHelperState = DefPromiseHelperState.READY

  /**
   * 无实际意义
   */
  get state() {
    return this.__state
  }

  /**
   * 校验promise
   */
  get promise() {
    return this.__promise
  }

  constructor() {
    this.__ee = new EventEmitter()
    this.__promise = new Promise((resolve, reject) => {
      this.__ee.on('resolve', () => {
        resolve()
      })
      this.__ee.on('reject', () => {
        reject()
      })
    })
    this.__state = DefPromiseHelperState.PENDING
  }

  /**
   * 用resolve来解决所有的情况
   */
  resolve() {
    this.__ee.emit('resolve')
    this.__state = DefPromiseHelperState.RESOLVED
  }

  /**
   * 禁用reject，否则await可能会抛出异常
   */
  private reject() {
    this.__ee.emit('reject')
    this.__state = DefPromiseHelperState.REJECTED
  }
}
