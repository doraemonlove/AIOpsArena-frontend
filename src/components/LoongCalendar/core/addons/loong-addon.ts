import type { LoongCalendar } from '../../'

export abstract class LoongAddon {
  readonly __loong: LoongCalendar

  constructor(loong: LoongCalendar) {
    this.__loong = loong
    this.__loong.on('destory', this.destroy, this)
  }

  protected abstract destroy(): void
}
