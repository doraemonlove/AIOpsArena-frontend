import type { LoongCalendar } from '..'
import { LoongAddon } from './loong-addon'
import type { ScheduleRenderData } from './loong-addon-manager'
import { DayRenderer } from './renderers/day-renderer'
import { GridLineRenderer } from './renderers/grid-line-renderer'
import { NowTimeRenderer } from './renderers/now-time-renderer'
import { ScheduleRenderer } from './renderers/schedule-renderer'
import { ScrollbarRenderer } from './renderers/scrollbar-renderer'
import { TimeRenderer } from './renderers/time-renderer'

/**
 * 节流函数
 * @param func 待执行的函数
 * @param delay 节流时间
 * @returns Function
 */
function throttle<T extends (...args: any[]) => void>(func: T, delay: number = 200): T {
  let timerId: NodeJS.Timeout | null = null
  let lastExecutedTime = 0
  return function (this: ThisParameterType<T>, ...args: any[]) {
    const currentTime = Date.now()
    const timeSinceLastExecution = currentTime - lastExecutedTime
    if (timeSinceLastExecution >= delay) {
      func.apply(this, args)
      lastExecutedTime = currentTime
    } else {
      if (timerId) {
        clearTimeout(timerId)
      }
      timerId = setTimeout(() => {
        func.apply(this, args)
        lastExecutedTime = Date.now()
      }, delay - timeSinceLastExecution)
    }
  } as T
}

export class Renderer extends LoongAddon {
  private __canvas: HTMLCanvasElement | null = null
  private __ctx: CanvasRenderingContext2D | null = null

  get ctx() {
    return this.__ctx
  }

  private __mouseIsDown = false
  private __mouseIsIn = false
  private __reversalXInput = false
  private __reversalYInput = false

  /**
   * 强制变换scale offset
   */
  private __fouse = false

  xScale = 1
  yScale = 1
  lastXScale = 1
  lastYScale = 1
  xStep = 0.2 // 放大或缩小的步长
  yStep = 0.2 // 放大或缩小的步长

  private __scrollOffset = 40

  canvasWidth = 0
  canvasHeight = 0
  currentMouseX = 0
  currentMouseY = 0
  mouseX = 0 // 鼠标的x坐标（相对于canvas）
  mouseY = 0 // 鼠标的y坐标（相对于canvas）

  xOffset = 0 // 日历x轴偏移
  yOffset = 0 // 日历y轴偏移

  calendarLT: [number, number] = [0, 0] // 日历左上角顶点坐标
  calendarRB: [number, number] = [0, 0] // 日历右下角顶点坐标
  timeLT: [number, number] = [0, 0] // 左侧显示时间的左上角顶点坐标
  timeRB: [number, number] = [0, 0] // 左侧显示时间的右下角顶点坐标
  dayLT: [number, number] = [0, 0] // 顶部显示日期的左上角顶点坐标
  dayRB: [number, number] = [0, 0] // 顶部显示日期的右下角顶点坐标
  verticalScrollbarLT: [number, number] = [0, 0] // 竖向滚动条左上角顶点坐标
  verticalScrollbarRB: [number, number] = [0, 0] // 竖向滚动条右下角顶点坐标
  horizontalScrollbarLT: [number, number] = [0, 0] // 水平滚动条左上角顶点坐标
  horizontalScrollbarRB: [number, number] = [0, 0] // 水平滚动条右下角顶点坐标

  readonly dayRenderer: DayRenderer
  readonly gridLineRenderer: GridLineRenderer
  readonly nowTimeRenderer: NowTimeRenderer
  readonly scheduleRenderer: ScheduleRenderer
  readonly scrollbarRenderer: ScrollbarRenderer
  readonly timeRenderer: TimeRenderer

  /**
   * 作节流
   */
  private renderDataUpdateThrottle = throttle(this.renderDataUpdate)

  constructor(loong: LoongCalendar) {
    super(loong)

    this.__loong.on('canvas-online', this.canvasOnline, this)
    this.__loong.on('canvas-offline', this.canvasOffline, this)
    this.__loong.on('resize', this.resize, this)
    this.__loong.on('reset-color', this.resetColor, this)
    this.__loong.on('canvas-x-zoom-in', this.xZoomIn, this)
    this.__loong.on('canvas-x-zoom-out', this.xZoomOut, this)
    this.__loong.on('canvas-y-zoom-in', this.yZoomIn, this)
    this.__loong.on('canvas-y-zoom-out', this.yZoomOut, this)
    this.__loong.on('mouse-move', this.mouseMove, this)
    this.__loong.on('mouse-in', this.mouseIn, this)
    this.__loong.on('mouse-out', this.mouseOut, this)
    this.__loong.on('mouse-down', this.mouseDown, this)
    this.__loong.on('mouse-up', this.mouseUp, this)
    this.__loong.on('mouse-click', this.mouseClick, this)
    this.__loong.on('one-second-passed', this.oneSecondPassed, this)
    this.__loong.on('scroll-up', this.scrollUp, this)
    this.__loong.on('scroll-down', this.scrollDown, this)
    this.__loong.on('render-data-update', this.renderDataUpdateThrottle, this)
    this.__loong.on('render-type-change', this.renderTypeChange, this)
    this.__loong.on('render-data-in', this.renderDataIn, this)
    this.__loong.on('render-data-out', this.renderDataOut, this)
    this.__loong.on('force-render', this.forceRender, this)

    this.dayRenderer = new DayRenderer(this)
    this.timeRenderer = new TimeRenderer(this)
    this.nowTimeRenderer = new NowTimeRenderer(this)
    this.scrollbarRenderer = new ScrollbarRenderer(this)
    this.gridLineRenderer = new GridLineRenderer(this)
    this.scheduleRenderer = new ScheduleRenderer(this)
  }

  private canvasOnline() {
    const canvas = document.getElementById(this.__loong.id) as HTMLCanvasElement
    this.__canvas = canvas
    this.__ctx = canvas.getContext('2d')
    this.resize()
  }

  private canvasOffline() {
    this.__canvas = null
    this.__ctx = null
  }

  private resize() {
    if (this.__canvas === null || this.__ctx === null) return
    this.canvasWidth = this.__canvas.clientWidth
    this.canvasHeight = this.__canvas.clientHeight
    const dpr = window.devicePixelRatio || 1 // 获取设备像素比
    this.__canvas.width = this.canvasWidth * dpr
    this.__canvas.height = this.canvasHeight * dpr
    this.__ctx.scale(dpr, dpr)
    this.render()
  }

  private resetColor() {}

  private scrollUp() {
    if (this.__canvas === null) return
    this.yOffset += this.__scrollOffset
    this.render()
  }

  private scrollDown() {
    if (this.__canvas === null) return
    this.yOffset -= this.__scrollOffset
    this.render()
  }

  private xZoomIn() {
    if (this.__canvas === null) return
    if (!this.__mouseIsIn) return
    this.xScale += this.xStep * this.xScale
    this.render()
  }

  private xZoomOut() {
    if (this.__canvas === null) return
    if (!this.__mouseIsIn) return
    this.xScale -= this.xStep * this.xScale
    this.xScale = Math.max(this.xScale, 1)
    this.render()
  }

  private yZoomIn() {
    if (this.__canvas === null) return
    if (!this.__mouseIsIn) return
    this.yScale += this.yStep * this.yScale
    this.render()
  }

  private yZoomOut() {
    if (this.__canvas === null) return
    if (!this.__mouseIsIn) return
    this.yScale -= this.yStep * this.yScale
    this.yScale = Math.max(this.yScale, 1)
    this.render()
  }

  private mouseMove(event: MouseEvent) {
    if (this.__canvas === null) return
    this.scrollbarRenderer.mouseMove(event)
    this.currentMouseX = event.offsetX
    this.currentMouseY = event.offsetY
    if (this.__mouseIsDown) {
      const diffX = event.offsetX - this.mouseX
      const diffY = event.offsetY - this.mouseY
      // 在单日模式下禁用水平滚动
      if (this.__loong.manager.type.value === 'week') {
        this.xOffset += this.__reversalXInput ? -diffX : diffX
      }
      this.yOffset += this.__reversalYInput ? -diffY : diffY
      this.render()
      this.__loong.emit('set-canvas-cursor-pointer', 'grabbing')
    }
    this.mouseX = event.offsetX
    this.mouseY = event.offsetY
  }

  private mouseIn() {
    if (this.__canvas === null) return
    this.__mouseIsIn = true
  }

  private mouseOut() {
    if (this.__canvas === null) return
    this.__mouseIsIn = false
  }

  private mouseDown(event: MouseEvent) {
    if (this.__canvas === null) return
    const x = event.offsetX
    const y = event.offsetY
    if (x >= this.calendarLT[0] && x <= this.calendarRB[0] && y >= this.calendarLT[1] && y <= this.calendarRB[1]) {
      this.__mouseIsDown = true
      this.mouseX = event.offsetX
      this.mouseY = event.offsetY
      this.__loong.emit('set-canvas-cursor-pointer', 'grabbing')
    }
    if (x >= this.horizontalScrollbarLT[0] && x <= this.horizontalScrollbarRB[0] && y >= this.horizontalScrollbarLT[1] && y <= this.horizontalScrollbarRB[1]) {
      this.scrollbarRenderer.downInHThumb(event)
    }
    if (x >= this.verticalScrollbarLT[0] && x <= this.verticalScrollbarRB[0] && y >= this.verticalScrollbarLT[1] && y <= this.verticalScrollbarRB[1]) {
      this.scrollbarRenderer.downInVThumb(event)
    }
  }

  private mouseUp(event: MouseEvent) {
    if (this.__canvas === null) return
    this.__mouseIsDown = false
    this.scrollbarRenderer.mouseUp()
    this.__loong.emit('set-canvas-cursor-pointer', 'default')
  }

  private mouseClick(event: MouseEvent) {}

  private oneSecondPassed() {
    if (this.__canvas === null) return
    this.render()
  }

  private forceRender() {
    if (this.__canvas === null) return
    this.render()
  }

  private renderDataUpdate() {
    if (this.__canvas === null) return
    this.render()
  }

  private renderDataIn(schedule: ScheduleRenderData) {
    // if (this.__canvas === null) return
    // this.render()
  }

  private renderDataOut(schedule: ScheduleRenderData) {
    // if (this.__canvas === null) return
    // this.render()
  }

  private renderTypeChange(type: 'date' | 'week') {
    if (this.__canvas === null) return
    if (type === 'date') {
      const res = this.gridLineRenderer.calculateShowDay()
      this.xScale = res[0]
      this.yScale = res[1]
      this.xOffset = res[2]
      this.yOffset = res[3]
      console.log(res)
    } else {
      this.xOffset = 0
      this.yOffset = 0
      this.xScale = 1
      this.yScale = 1
    }
    this.__fouse = true
    this.render()
  }

  updateOffset(x: number, y: number, resetX: boolean = false, resetY: boolean = false) {
    if (this.__canvas === null) return
    this.xOffset = resetX ? x : this.xOffset + x
    this.yOffset = resetY ? y : this.yOffset + y
    this.render()
  }

  private render() {
    const ctx = this.ctx
    if (ctx === null) return
    ctx.clearRect(-100, -100, this.canvasWidth + 100, this.canvasHeight + 100)
    // 计算尺寸
    this.calculate()
    if (!this.__fouse) {
    // 检查scale
      const scaleRes = this.gridLineRenderer.checkScale()
      this.xScale = scaleRes[0]
      this.yScale = scaleRes[1]
      this.xOffset = scaleRes[2]
      this.yOffset = scaleRes[3]
      // 检查offset是否合法
      const offsetRes = this.gridLineRenderer.checkOffset()
      this.xOffset = offsetRes[0]
      this.yOffset = offsetRes[1]
    }
    this.lastXScale = this.xScale
    this.lastYScale = this.yScale
    this.__fouse = false
    // 绘制
    this.gridLineRenderer.render(ctx) // 画网格线
    this.timeRenderer.render(ctx) // 画左侧时间
    this.scheduleRenderer.render(ctx) // 画日程
    this.nowTimeRenderer.render(ctx) // 画当前时间
    this.dayRenderer.render(ctx) // 画顶部日期
    this.scrollbarRenderer.render(ctx) // 画滚动条
  }

  /**
   * 计算各个区域的大小
   */
  private calculate() {
    const canvasWidth = this.canvasWidth
    const canvasHeight = this.canvasHeight
    this.dayLT = [this.timeRenderer.width, 0]
    this.dayRB = [canvasWidth - this.scrollbarRenderer.size, this.dayRenderer.height]
    this.timeLT = [0, this.dayRenderer.height]
    this.timeRB = [this.timeRenderer.width, canvasHeight - this.scrollbarRenderer.size]
    this.verticalScrollbarLT = [this.dayRB[0], 0]
    this.verticalScrollbarRB = [this.dayRB[0] + this.scrollbarRenderer.size, canvasHeight - this.scrollbarRenderer.size]
    this.horizontalScrollbarLT = [0, this.timeRB[1]]
    this.horizontalScrollbarRB = [canvasWidth - this.scrollbarRenderer.size, canvasHeight]
    this.calendarLT = [this.timeRenderer.width, this.dayRenderer.height]
    this.calendarRB = [canvasWidth - this.scrollbarRenderer.size, canvasHeight - this.scrollbarRenderer.size]
  }

  protected destroy(): void {}
}
