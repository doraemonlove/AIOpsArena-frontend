import type { LoongCalendar } from '../../'
import type {
  LoongCalendarCurrentTimeRendererOptions,
  LoongCalendarDateRendererOptions,
  LoongCalendarGridRendererOptions,
  LoongCalendarOptions,
  LoongCalendarScheduleRendererOptions,
  LoongCalendarScrollbarRendererOptions,
  LoongCalendarTimeRendererOptions
} from '../../types'
import { LoongAddon } from './loong-addon'
const lightOptions = {
  colors: ['#00A0FF', '#FF87C8', '#62CE9A', '#F98B71', '#7862E2', '#CF5789'],
  dark: false,
  backgroundColor: 'white',
  linesColor: 'rgba(0, 0, 0, 0.8)',
  schedule: {
    color: 'white',
    titleFontFamily: 'Arial',
    contentFontFamily: 'Arial',
    timeFontFamily: 'Arial',
    titleFontSize: 20,
    contentFontSize: 18,
    timeFontSize: 12
  },
  time: {
    fontFamily: 'Arial',
    fontSize: 18,
    color: 'black',
    backgroundColor: ''
  },
  date: {
    fontFamily: 'Arial',
    weekFontSize: 18,
    dateFontSize: 18,
    color: 'black',
    backgroundColor: 'rgb(245, 247, 249)'
  },
  current: {
    fontFamily: 'Arial',
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(79, 173, 255, 1)',
    size: 7
  },
  scrollbar: {
    thumbColor: 'rgb(185, 188, 194)',
    backgroundColor: 'rgb(220, 223, 230)'
  }
}
const darkOptions = {
  colors: ['#00A0FF', '#FF87C8', '#62CE9A', '#F98B71', '#7862E2', '#CF5789'],
  dark: true,
  backgroundColor: 'black',
  linesColor: 'rgba(255, 255, 255, 0.8)',
  schedule: {
    color: 'white',
    titleFontFamily: 'Arial',
    contentFontFamily: 'Arial',
    timeFontFamily: 'Arial',
    titleFontSize: 20,
    contentFontSize: 18,
    timeFontSize: 12
  },
  time: {
    fontFamily: 'Arial',
    fontSize: 18,
    color: 'white',
    backgroundColor: ''
  },
  date: {
    fontFamily: 'Arial',
    weekFontSize: 18,
    dateFontSize: 18,
    color: 'white',
    backgroundColor: 'rgb(43, 43, 43)'
  },
  current: {
    fontFamily: 'Arial',
    fontSize: 16,
    color: 'black',
    backgroundColor: 'rgba(79, 173, 255, 1)',
    size: 7
  },
  scrollbar: {
    thumbColor: 'rgb(105, 105, 105)',
    backgroundColor: 'rgb(43, 43, 43)'
  }
}
type DeepRequired<T> = T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } : T
type LoongCalendarRequiredOptions = DeepRequired<LoongCalendarOptions>
const defaultOptions: LoongCalendarRequiredOptions = {
  themes: {
    light: lightOptions,
    dark: darkOptions
  },
  grid: {
    timeWidth: 80,
    cellMinWidth: 160,
    scrollbarSize: 10,
    dateHeight: 60,
    yScale: 1,
    cells: [
      { range: '1h', displayHeight: 80, maxHeight: 0 },
      { range: '20m', displayHeight: 80, maxHeight: 0 },
      { range: '10m', displayHeight: 60, maxHeight: 0 },
      { range: '2m', displayHeight: 60, maxHeight: 0 },
      { range: '1m', displayHeight: 60, maxHeight: 0 },
      { range: '30s', displayHeight: 60, maxHeight: 0 },
      { range: '10s', displayHeight: 60, maxHeight: 80 }
    ]
  },
  scheduleDisplay: {
    layoutMode: 'precise',
    snapMinutes: 60,
    minDurationMinutes: 20,
    durationStepMinutes: 20
  },
  mode: 'default',
  categories: []
}

function isPlainObject(value: any) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function mergeThemeOptions(target: Record<string, any>, source: Record<string, any>) {
  const nextTarget = { ...target }
  for (const themeKey in source) {
    const targetTheme = isPlainObject(nextTarget[themeKey]) ? nextTarget[themeKey] : {}
    const sourceTheme = source[themeKey]
    nextTarget[themeKey] = isPlainObject(sourceTheme)
      ? deepMerge({ ...targetTheme }, sourceTheme)
      : sourceTheme
  }
  return nextTarget
}

function deepMerge(target: any, source: any) {
  for (const key in target) {
    // themes合并、覆盖
    if (key === 'themes' && isPlainObject(source[key])) {
      target[key] = mergeThemeOptions(target[key], source[key])
    } else if (key === 'categories' && Array.isArray(source[key])) {
      target[key] = source[key]
    } else if (key === 'cells' && Array.isArray(source[key])) {
      target[key] = source[key]
    } else if (
      (isPlainObject(target[key]) && isPlainObject(source[key])) ||
      (Array.isArray(target[key]) && Array.isArray(source[key]))
    ) {
      deepMerge(target[key], source[key])
    } else if (source[key] === undefined || source[key] === null) {
      continue
    } else if (typeof target[key] === typeof source[key]) {
      target[key] = source[key]
    }
  }
}

export class Options extends LoongAddon {
  private readonly __options: LoongCalendarRequiredOptions = defaultOptions
  private __colors: string[] = []
  private __categories: string[] = []
  private __currentTheme: string = 'light'

  constructor(loong: LoongCalendar, options: LoongCalendarOptions, theme?: string) {
    super(loong)

    deepMerge(this.__options, options)
    this.setTheme(theme || 'light')
  }

  update(options: LoongCalendarOptions) {
    deepMerge(this.__options, options)
    this.__loong.emit('theme-change', this.__currentTheme)
    this.__loong.emit('force-render')
  }

  /**
   * 应用主题
   * @param theme 主题名称
   */
  useTheme(theme: string) {
    this.setTheme(theme, true)
    this.__loong.emit('theme-change', theme)
  }

  /**
   * 根据分类获取颜色
   * @param category 分类名称
   */
  getColor(category: string | number) {
    const colors = Array.isArray(this.__colors) && this.__colors.length > 0
      ? this.__colors
      : lightOptions.colors

    if (typeof category === 'number') {
      const i = category % colors.length
      return colors[i]
    } else {
      const categories = Array.isArray(this.__categories) ? this.__categories : []
      const i = categories.indexOf(category) % colors.length
      if (i === -1) {
        return colors[0]
      }
      return colors[i]
    }
  }

  private setTheme(theme: string, user: boolean = false) {
    this.__currentTheme = theme
    const res = this.analyseOptions()
    if (user) {
      const renderer = this.__loong.renderer
    }
  }

  analyseOptions() {
    const theme = this.__currentTheme
    const options = this.__options
    const themeOptions = this.__options.themes[theme] || lightOptions
    this.__colors = Array.isArray(themeOptions.colors) && themeOptions.colors.length > 0 ? themeOptions.colors : lightOptions.colors
    this.__categories = Array.isArray(this.__options.categories) ? this.__options.categories : []
    const gridOptions = {
      timeWidth: options.grid.timeWidth,
      cellMinWidth: options.grid.cellMinWidth,
      scrollbarSize: options.grid.scrollbarSize,
      dateHeight: options.grid.dateHeight
    }
    const gridRendererOptions: LoongCalendarGridRendererOptions = {
      dark: themeOptions.dark,
      linesColor: themeOptions.linesColor,
      backgroundColor: themeOptions.backgroundColor,
      yScale: options.grid.yScale,
      ...gridOptions,
      cells: options.grid.cells
    }
    const dateRendererOptions: LoongCalendarDateRendererOptions = {
      dark: themeOptions.dark,
      linesColor: themeOptions.linesColor,
      ...gridOptions,
      fontFamily: themeOptions.date.fontFamily,
      weekFontSize: themeOptions.date.weekFontSize,
      dateFontSize: themeOptions.date.dateFontSize,
      color: themeOptions.date.color,
      backgroundColor: themeOptions.date.backgroundColor
    }
    const currentTimeRendererOptions: LoongCalendarCurrentTimeRendererOptions = {
      dark: themeOptions.dark,
      ...gridOptions,
      fontFamily: themeOptions.current.fontFamily,
      fontSize: themeOptions.current.fontSize,
      color: themeOptions.current.color,
      backgroundColor: themeOptions.current.backgroundColor,
      size: themeOptions.current.size
    }
    const timeRendererOptions: LoongCalendarTimeRendererOptions = {
      dark: themeOptions.dark,
      ...gridOptions,
      fontFamily: themeOptions.time.fontFamily,
      fontSize: themeOptions.time.fontSize,
      color: themeOptions.time.color,
      backgroundColor: themeOptions.time.backgroundColor
    }
    const scheduleRendererOptions: LoongCalendarScheduleRendererOptions = {
      dark: themeOptions.dark,
      ...gridOptions,
      colors: this.__colors,
      color: themeOptions.schedule.color,
      categories: this.__categories,
      titleFontFamily: themeOptions.schedule.titleFontFamily,
      contentFontFamily: themeOptions.schedule.contentFontFamily,
      timeFontFamily: themeOptions.schedule.timeFontFamily,
      timeFontSize: themeOptions.schedule.timeFontSize,
      titleFontSize: themeOptions.schedule.titleFontSize,
      contentFontSize: themeOptions.schedule.contentFontSize,
      layoutMode: options.scheduleDisplay.layoutMode,
      snapMinutes: options.scheduleDisplay.snapMinutes,
      minDurationMinutes: options.scheduleDisplay.minDurationMinutes,
      durationStepMinutes: options.scheduleDisplay.durationStepMinutes
    }
    const scrollbarRendererOptions: LoongCalendarScrollbarRendererOptions = {
      dark: themeOptions.dark,
      ...gridOptions,
      thumbColor: themeOptions.scrollbar.thumbColor,
      backgroundColor: themeOptions.scrollbar.backgroundColor
    }
    const res = {
      gridRendererOptions,
      dateRendererOptions,
      currentTimeRendererOptions,
      timeRendererOptions,
      scheduleRendererOptions,
      scrollbarRendererOptions
    }
    return res
  }

  getScheduleDisplayOptions() {
    return this.__options.scheduleDisplay
  }

  protected destroy(): void {}
}
