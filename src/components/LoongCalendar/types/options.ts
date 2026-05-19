export interface LoongCalendarThemeOptions {
  /**
   * 不同分类的颜色
   * #### colors为数组
   * - 分类为数字：求模取色
   * - 分类为字符串：不在分组内取第一个颜色，在分组内按照分组内顺序取色
   */
  colors?: string[]
  /**
   * 是否是dark主题
   */
  dark?: boolean
  /**
   * canvas背景色
   */
  backgroundColor?: string
  linesColor?: string
  schedule?: {
    color?: string
    titleFontFamily?: string
    contentFontFamily?: string
    titleFontSize?: number
    contentFontSize?: number
    timeFontFamily?: string
    timeFontSize?: number
  }
  time?: {
    fontFamily?: string
    fontSize?: number
    color?: string
    backgroundColor?: string
  }
  date: {
    fontFamily?: string
    weekFontSize?: number
    dateFontSize?: number
    color?: string
    backgroundColor?: string
  }
  current: {
    fontFamily?: string
    fontSize?: number
    color?: string
    backgroundColor?: string
    /**
     * 三角形大小
     */
    size?: number
  }
  scrollbar: {
    thumbColor?: string
    backgroundColor?: string
  }
}

export interface LoongCalendarGridOptions {
  /**
   * 日历左侧时间轴宽度，某认 80
   */
  timeWidth?: number
  cellMinWidth?: number
  scrollbarSize?: number
  dateHeight?: number
  yScale?: number
  /**
   * ### 每格时间范围
   * #### 示例
   * ```ts
   * const options = {
   *   grid: {
   *     everyCellOption: [
   *       { range: '1h', displayHeight: 80 },
   * //    { range: 60 * 60, displayHeight: 80 }, // 用数字的情况，单位(s)
   *       { range: '20m', displayHeight: 80 },
   *       { range: '10m', displayHeight: 60 },
   *       { range: '2m', displayHeight: 60 },
   *       { range: '1m', displayHeight: 60 },
   *       { range: '30s', displayHeight: 60 },
   *       { range: '10s', displayHeight: 60, maxHeight: 80 }
   *     ]
   *   }
   * }
   * ```
   * 其代表初始情况每个单元格高80px，代表1h。当垂直放大到每个1h单元格高度变为240px时，此时20m对应的高度为80px，此时会渲染20m单元格。以此类推。
   *
   * 最后一个元素需要加上maxHeight，代表最后一个单元格能放大到的最大高度，其余元素该值无效。
   */
  cells?: { range: string | number, displayHeight: number, maxHeight?: number }[]
}

export interface LoongCalendarOptions {
  /**
   * 日历各种尺寸配置
   */
  grid?: LoongCalendarGridOptions
  scheduleDisplay?: {
    layoutMode?: 'precise' | 'block'
    snapMinutes?: number
    minDurationMinutes?: number
    durationStepMinutes?: number
  }
  themes?: Record<string, LoongCalendarThemeOptions>
  mode?: 'default' | 'week' | 'date'
  categories?: string[]
}
