import type { TimeRange } from '../core/schedule'

export interface LoongCalendarGridRendererOptions {
  dark: boolean,
  backgroundColor: string
  linesColor: string
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  yScale: number
  cells: { range: string | number; displayHeight: number; maxHeight: number }[]
}

export interface LoongCalendarDateRendererOptions {
  dark: boolean,
  linesColor: string
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  fontFamily: string
  weekFontSize: number
  dateFontSize: number
  color: string
  backgroundColor: string
}

export interface LoongCalendarCurrentTimeRendererOptions {
  dark: boolean,
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor: string
  size: number
}

export interface LoongCalendarScheduleRendererOptions {
  dark: boolean,
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  colors: string[]
  color: string,
  categories: string[]
  titleFontFamily: string
  contentFontFamily: string
  timeFontFamily: string
  timeFontSize: number
  titleFontSize: number
  contentFontSize: number
  layoutMode: 'precise' | 'block'
  snapMinutes: number
  minDurationMinutes: number
  durationStepMinutes: number
}

export interface LoongCalendarScrollbarRendererOptions {
  dark: boolean,
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  thumbColor: string
  backgroundColor: string
}

export interface LoongCalendarTimeRendererOptions {
  dark: boolean,
  timeWidth: number
  cellMinWidth: number
  scrollbarSize: number
  dateHeight: number
  fontFamily: string
  fontSize: number
  color: string
  backgroundColor: string
}

export interface LoongCalendaerRendererOptions {
  gridRendererOptions: LoongCalendarGridRendererOptions
  dateRendererOptions: LoongCalendarDateRendererOptions
  currentTimeRendererOptions: LoongCalendarCurrentTimeRendererOptions
  timeRendererOptions: LoongCalendarTimeRendererOptions
  scheduleRendererOptions: LoongCalendarScheduleRendererOptions
  scrollbarRendererOptions: LoongCalendarScrollbarRendererOptions
}

export enum LoongCalendarScheduleStatus {
  READY = 'READY',
  SUCCESS = 'SUCCESS',
  HIDDEN = 'HIDDEN',
  FAILURE = 'FAILURE',
  DESTORYED = 'DESTORYED',
}

export type LoongCalendarManagerScheduleData =
  | LoongCalendarManagerScheduleDataOnce
  | LoongCalendarManagerScheduleDataLoop
/** 单次日程 */

export interface LoongCalendarManagerScheduleDataOnce {
  /** [year, month, date][] */
  date: [string, string, string][]
}
/** 循环日程 */
export interface LoongCalendarManagerScheduleDataLoop {
  /** 起始时间（计算到00:00:00）默认为 0 */
  begin: Date
  /** 截止时间（计算到00:00:00）默认为 253402271999999 （9999-12-31 23:59:59:999） */
  end: Date
  /** 每天的情况 true: 每天都可以; number[]: 日期在number内的才成功; number: 每隔number天执行 */
  everydate: true | number[] | number
  /** 每周几的情况 true: 周几都可以; number[]: 星期在number内的才成功; number: 每隔number周执行 */
  everyweek: true | number[] | number
  /** 每天的情况 true: 每月都可以; number[]: 月份在number内的才成功; number: 每隔number月执行 */
  everymonth: true | number[] | number
  /** 每天的情况 true: 每年都可以; number[]: 年份在number内的才成功; number: 每隔number年执行 */
  everyyear: true | number[] | number
}

export enum ScheduleBucketsType {
  YEAR,
  MONTH,
  WEEK,
  DATE,
}

export type LoongScheduleBaseData = LoongScheduleOnceData | LoongScheduleLoopData

export interface LoongScheduleOnceData {
  /** 日程开始时刻 */
  startTime: Date
  /** 日程结束时刻 */
  endTime: Date
  /** 日程经过的日期, 格式为 [year, month 1-12, date 1-31], 长度不足2前面会补0 */
  date: [string, string, string][]
  /** 日程的TimeRange */
  timeRange: TimeRange[]
}

export interface LoongScheduleLoopData {
  /** 起始时间（计算到00:00:00）默认为 0 */
  begin: Date
  /** 截止时间（计算到00:00:00）默认为 253402271999999 （9999-12-31 23:59:59:999） */
  end: Date
  /** 起始的详细时间，时、分、秒 */
  startTime: [number, number, number]
  /** 结束的详细时间，时、分、秒 */
  endTime: [number, number, number]
  /** 每天的情况 true: 每天都可以; number[]: 日期在number内的才成功（1-31）; number: 每隔number天执行 */
  everydate: true | number[] | number
  /** 每周几的情况 true: 周几都可以; number[]: 星期在number内的才成功（0-7）; number: 每隔number周执行 */
  everyweek: true | number[] | number
  /** 每月的情况 true: 每月都可以; number[]: 月份在number内的才成功（1-12）; number: 每隔number月执行 */
  everymonth: true | number[] | number
  /** 每年的情况 true: 每年都可以; number[]: 年份在number内的才成功（1970-9999）; number: 每隔number年执行 */
  everyyear: true | number[] | number
}

export enum LoongCalendarScheduleInManagerStatus {
  ADDING,
  ADDED,
  RENDERED,
  REMOVING,
}
