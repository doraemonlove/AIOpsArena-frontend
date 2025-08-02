import EventEmitter from 'eventemitter3'
import type { LoongCalendarOptions, LoongEvents } from './types'
import { Renderer } from './core/loong-addon-renderer'
import { Observer } from './core/loong-addon-observer'
import { Events } from './core/loong-addon-events'
import { Manager } from './core/loong-addon-manager'
import { Options } from './core/loong-addon-options'

export * from './core/schedule/index'

export class LoongCalendar extends EventEmitter<LoongEvents> {
  private __map

  readonly id: string
  readonly renderer: Renderer
  readonly observer: Observer
  readonly manager: Manager
  readonly events: Events
  readonly options: Options

  private __oneSecondTimer: null | NodeJS.Timeout = null

  private __resizeFunc = this.resize.bind(this)

  constructor(id: string, options: LoongCalendarOptions, map: Map<string, LoongCalendar>) {
    super()
    this.__map = map
    this.id = id

    this.renderer = new Renderer(this)
    this.observer = new Observer(this)
    this.manager = new Manager(this)
    this.events = new Events(this)
    this.options = new Options(this, options)

    this.init()
  }

  private init() {
    window.addEventListener('resize', this.__resizeFunc)
    this.on('canvas-online', this.canvasOnline, this)
    this.on('canvas-offline', this.canvasOffline, this)
  }

  private resize() {
    this.emit('resize')
  }

  private canvasOnline() {
    this.startOneMinuteTimer()
  }

  private canvasOffline() {
    if (this.__oneSecondTimer) clearInterval(this.__oneSecondTimer)
  }

  private startOneMinuteTimer() {
    if (this.__oneSecondTimer) clearInterval(this.__oneSecondTimer)
    this.__oneSecondTimer = setInterval(() => {
      this.emit('one-second-passed')
    }, 1000)
  }

  reset() {
    this.emit('reset')
  }

  destroy() {
    this.__map.delete(this.id)
    window.removeEventListener('resize', this.__resizeFunc)
    if (this.__oneSecondTimer) clearInterval(this.__oneSecondTimer)
    this.emit('destory')
  }
}

const map = new Map<string, LoongCalendar>()

export function useCalendar(id: string, options: LoongCalendarOptions = {}) {
  if (!map.has(id)) map.set(id, new LoongCalendar(id, options, map))
  return map.get(id) as LoongCalendar
}

export function destoryCalendar(id: string) {
  if (!map.has(id)) return false
  const calendar = map.get(id) as LoongCalendar
  calendar.destroy()
  map.delete(id)
  return true
}
