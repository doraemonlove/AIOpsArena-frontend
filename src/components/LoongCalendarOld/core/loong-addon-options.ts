import type { LoongCalendar } from '..'
import type { LoongCalendarOptions } from '../types'
import { LoongAddon } from './loong-addon'

const lightColors = ['#00A0FF', '#62CE9A', '#F98B71', '#7862E2', '#CF5789']
const darkColors = ['#00A0FF', '#62CE9A', '#F98B71', '#7862E2', '#CF5789']

export class Options extends LoongAddon {
  private readonly __options: LoongCalendarOptions
  private __colors: string[] = []
  private __category: string[] = []

  constructor(loong: LoongCalendar, options: LoongCalendarOptions) {
    super(loong)

    this.__options = options
    this.init()
  }

  update(options: LoongCalendarOptions) {}

  private init() {
    // 设置colors
    this.initColors()
  }

  private initColors() {
    const darkMode = false
    const colors = darkMode ? darkColors : lightColors
    this.__colors = colors
    this.__category = []
  }

  protected destroy(): void {}

  getColor(category: string | number) {
    const ti = typeof category === 'string' ? this.__category.indexOf(category) : category
    const index = Math.max(0, ti % this.__colors.length)
    return this.__colors[index]
  }
}
