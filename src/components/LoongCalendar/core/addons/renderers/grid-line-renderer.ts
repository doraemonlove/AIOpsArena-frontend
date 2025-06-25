import type { LoongCalendarGridRendererOptions } from '../../../types'
import type { Renderer } from '../loong-addon-renderer'
import { RendererBase } from './renderer-base'
import { parseTimeToSeconds } from '../../utils'

export class GridLineRenderer extends RendererBase {
  readonly minWidth: number
  readonly minHeight: number
  readonly linesSpacing: number[]
  readonly timeSpacing: number[]
  readonly linesAmount: number[]
  readonly calendarHeights: number[]
  private __options: LoongCalendarGridRendererOptions

  /**
   * 给time renderer提供的时间刻度，位置(y)和时间
   */
  timeLines: [number, string][] = []
  /**
   * 给day renderer提供的时间刻度，位置(x)
   */
  dayLines: [number][] = []
  /**
   * 给schedule renderer提供的数据，[date, startTimestamp, endTimestamp, left, width]
   */
  schedulePos: [Date, number, number, number, number][] = []

  calendarCurrentWidth: number = 0
  calendarCurrentHeight: number = 0
  calendarCurrentXOffset: number = 0
  calendarCurrentYOffset: number = 0
  calendarCurrentViewWidth: number = 0
  calendarCurrentViewHeight: number = 0

  currentYLevel: number = 0

  constructor(renderer: Renderer, options: LoongCalendarGridRendererOptions) {
    super(renderer)
    this.minWidth = options.cellMinWidth
    this.minHeight = options.cells[0].displayHeight
    this.linesSpacing = options.cells.map(item => item.displayHeight)
    this.linesSpacing.push(options.cells.at(-1)!.maxHeight)
    this.timeSpacing = options.cells.map(item => typeof item.range === 'string' ? parseTimeToSeconds(item.range) : item.range)
    this.timeSpacing.push(this.timeSpacing.at(-1)!)
    this.linesAmount = this.timeSpacing.map((s) => Math.floor(24 * 60 * 60 / s))
    this.calendarHeights = this.linesSpacing.map((s, i) => s * this.linesAmount[i])
    this.__options = options
  }

  destroy(): void {

  }

  checkOffset(): [number, number] {
    const xOffset  = Math.min(this.__renderer.xOffset, 0) // 不能比0大
    const yOffset = Math.min(this.__renderer.yOffset, 0) // 不能比0大
    const xScale = this.__renderer.xScale
    const yScale = this.__renderer.yScale
    const calendarLT = this.__renderer.calendarLT
    const calendarRB = this.__renderer.calendarRB
    const calendarViewWidth = calendarRB[0] - calendarLT[0]
    const calendarViewHeight = calendarRB[1] - calendarLT[1]
    const calendarOriginalWidth = Math.max(7 * this.minWidth, calendarViewWidth)
    const calendarOriginalHeight = this.linesAmount[0] * this.minHeight // calendar最初高度
    const calendarCurrentHeight = Math.floor(calendarOriginalHeight * yScale) // calendar当前高度
    const calendarCurrentWidth = Math.floor(calendarOriginalWidth * xScale) // calendar当前宽度
    const resXOffset = Math.max(calendarViewWidth - calendarCurrentWidth, xOffset)
    const resYOffset = Math.max(calendarViewHeight - calendarCurrentHeight, yOffset)
    return [resXOffset, resYOffset]
  }

  /**
   * 比例改变之后，计算期望的偏移
   * @returns [xScale, yScale, xOffset, yOffset]
   */
  checkScale(): [number, number, number, number] {
    const day = this.__renderer.__loong.manager.rendererDate.value.getDay()
    const xScale = Math.max(this.__renderer.xScale, 1) // 不能比1小
    const yScale = Math.max(this.__renderer.yScale, 1) // 不能比1小
    const lastXScale = this.__renderer.lastXScale
    const lastYScale = this.__renderer.lastYScale
    const calendarOriginalHeight = this.linesAmount[0] * this.minHeight // calendar最初高度
    const calendarCurrentHeight = Math.floor(calendarOriginalHeight * yScale) // calendar当前高度
    // 当前高度不能比最大高度大
    const calendarMaxHeight = this.linesAmount[this.linesAmount.length - 1] * this.linesSpacing[this.linesSpacing.length - 1]
    const resYScale = calendarMaxHeight >= calendarCurrentHeight ? yScale : calendarMaxHeight / calendarOriginalHeight
    // 当前宽度最宽为一天占据全部
    const calendarLT = this.__renderer.calendarLT
    const calendarRB = this.__renderer.calendarRB
    const calendarViewWidth = calendarRB[0] - calendarLT[0]
    const calendarOriginalWidth = Math.max(7 * this.minWidth, calendarViewWidth)
    const calendarCurrentWidth = Math.floor(calendarOriginalWidth * xScale) // calendar当前宽度
    const calendarMaxWidth = calendarViewWidth * 7
    const resXScale = (calendarMaxWidth >= calendarCurrentWidth) && this.__renderer.__loong.manager.type.value === 'week' ? xScale : calendarMaxWidth / calendarOriginalWidth
    const lastMouseX = this.__renderer.currentMouseX - this.__renderer.calendarLT[0] - this.__renderer.xOffset
    const lastMouseY = this.__renderer.currentMouseY - this.__renderer.calendarLT[1] - this.__renderer.yOffset
    const nowMouseX = lastMouseX / lastXScale * resXScale
    const nowMouseY = lastMouseY / lastYScale * resYScale
    const forDayXOffset = -calendarViewWidth * day
    const resXOffset = this.__renderer.__loong.manager.type.value === 'week' ? this.__renderer.xOffset + lastMouseX - nowMouseX : forDayXOffset
    const resYOffset = this.__renderer.yOffset + lastMouseY - nowMouseY
    return [resXScale, resYScale, resXOffset, resYOffset]
  }

  /**
   * 计算显示这天的偏移和缩放
   */
  calculateShowDay(): [number, number, number, number] {
    const date = this.__renderer.__loong.manager.rendererDate.value
    const day = date.getDay()
    const calendarLT = this.__renderer.calendarLT
    const calendarRB = this.__renderer.calendarRB
    const calendarViewWidth = calendarRB[0] - calendarLT[0]
    const calendarOriginalWidth = Math.max(7 * this.minWidth, calendarViewWidth)
    const everyWidth = calendarOriginalWidth / 7
    const resXScale = calendarViewWidth / everyWidth
    const resYScale = 1
    const resXOffset = -everyWidth * day * resXScale
    const resYOffset = 0
    return [resXScale, resYScale, resXOffset, resYOffset]
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.lineWidth = 1
    ctx.strokeStyle = this.__options.linesColor
    // 绘制网格线，计算视口内部的网格线
    const xOffset  = this.__renderer.xOffset
    const yOffset = this.__renderer.yOffset
    const xScale = this.__renderer.xScale
    const yScale = this.__renderer.yScale
    const calendarLT = this.__renderer.calendarLT
    const calendarRB = this.__renderer.calendarRB
    const calendarViewWidth = calendarRB[0] - calendarLT[0]
    const calendarViewHeight = calendarRB[1] - calendarLT[1]
    const calendarOriginalWidth = Math.max(7 * this.minWidth, calendarViewWidth)
    const calendarOriginalHeight = this.linesAmount[0] * this.minHeight // calendar最初高度
    const calendarCurrentHeight = Math.floor(calendarOriginalHeight * yScale) // calendar当前高度
    const calendarCurrentWidth = Math.floor(calendarOriginalWidth * xScale) // calendar当前宽度
    // 先计算出所有需要绘制的线条[x1, y1, x2, y2]
    // 然后去掉不出现在calendar内的线条
    // 然后裁剪线条
    const lines: [number, number, number, number][] = []
    const timeLines: [number, string][] = []
    const dayLines: [number][] = []
    const showTimeRange: [number, number] = [0, 0]
    const schedulePos: [Date, number, number, number, number][] = []
    const currentYLevelTemp = this.calendarHeights.findIndex((height) => height >= calendarCurrentHeight)
    const currentYLevel = Math.max(0, currentYLevelTemp - 1)
    const lineYAmount = this.linesAmount[currentYLevel]
    const spacingX = Math.floor(calendarCurrentWidth / 7)
    const spacingY = calendarCurrentHeight / lineYAmount
    ctx.translate(calendarLT[0], calendarLT[1]) // 将坐标系移动到calendar左上角
    const calendarX = xOffset // calendar左上角x坐标
    const calendarY = yOffset // calendar左上角y坐标
    // 存储数据
    this.calendarCurrentWidth = calendarCurrentWidth
    this.calendarCurrentHeight = calendarCurrentHeight
    this.calendarCurrentXOffset = calendarX
    this.calendarCurrentYOffset = calendarY
    this.calendarCurrentViewWidth = calendarViewWidth
    this.calendarCurrentViewHeight = calendarViewHeight
    this.currentYLevel = currentYLevel
    // manager数据
    const type = this.__renderer.__loong.manager.type.value
    const rendererDay = this.__renderer.__loong.manager.rendererDate.value
    const rendererWeek = this.__renderer.__loong.manager.rendererWeek.value
    // 水平线条，不画最后一根
    const time = new Date('2023-01-01 00:00:00')
    const timeSpacing = this.timeSpacing[currentYLevel]
    let currentSeconds = time.getSeconds()
    let l = -1
    let r = -1
    for (let i = 0; i < lineYAmount; i++) {
      const x1 = calendarX
      const y1 = calendarY + i * spacingY
      timeLines.push([y1, time.toLocaleTimeString()])
      time.setSeconds(currentSeconds + timeSpacing)
      currentSeconds = time.getSeconds()
      // 左上角，视口外
      if (x1 <= 2 && y1 <= 2) continue
      // 左下角，视口外
      if (x1 <= 2 && y1 >= calendarViewHeight - 2) {
        if (l !== -1 && r === -1) r = i
        continue
      }
      // 裁剪线条
      lines.push([0, y1, calendarViewWidth, y1])
      if (l === -1) l = i - 1
    }
    l = Math.max(0, l)
    r = r === -1 ? timeLines.length : r
    this.timeLines = timeLines.splice(l, r - l + 1)
    const tempStartDate = new Date(`2000-01-01 ${this.timeLines[0][1]}`)
    const tempEndDate = new Date(`2000-01-01 ${this.timeLines[this.timeLines.length - 1][1]}`)
    showTimeRange[0] = tempStartDate.getTime() - tempStartDate.setHours(0, 0, 0, 0)
    showTimeRange[1] = tempEndDate.getTime() - tempEndDate.setHours(0, 0, 0, 0)
    // 垂直线条，不画最后一根
    l = -1
    r = -1
    for (let i = 0; i < 7; i++) {
      const x1 = calendarX + i * spacingX
      const y1 = calendarY
      dayLines.push([x1])
      if (type === 'week') {
        schedulePos.push([rendererWeek[i], showTimeRange[0], showTimeRange[1], x1, spacingX])
      } else {
        schedulePos.push([rendererDay, showTimeRange[0], showTimeRange[1], x1, spacingX])
      }
      // 左上角，视口外
      if (x1 <= 2 && y1 <= 2) continue
      // 右上角，视口外
      if (x1 >= calendarViewWidth - 2 && y1 <= 2) {
        r = r === -1 ? i - 1 : r
        continue
      }
      // 裁剪线条
      lines.push([x1, 0, x1, calendarViewHeight])
      //
      l = l === -1 ? i - 1 : l
    }
    l = Math.max(l, 0)
    r = r === -1 ? 6 : r
    dayLines.push([calendarViewWidth])
    this.dayLines = dayLines
    this.schedulePos = schedulePos.splice(l, r - l + 1)
    // 加上外边框，上下左右
    lines.push([0, 0, calendarViewWidth, 0], [0, calendarViewHeight, calendarViewWidth, calendarViewHeight], [0, 0, 0, calendarViewHeight], [calendarViewWidth, 0, calendarViewWidth, calendarViewHeight])
    // 绘制线条
    // console.log(lines)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      ctx.beginPath()
      ctx.moveTo(line[0], line[1])
      ctx.lineTo(line[2], line[3])
      ctx.stroke()
    }
    ctx.restore()
  }
}
