import type { ScheduleRenderData } from '../loong-addon-manager'
import type { Renderer } from '../loong-addon-renderer'
import { RendererBase } from './renderer-base'

export class ScheduleRenderer extends RendererBase {
  private __showSchedule: [ScheduleRenderData, number, number, number, number][] = []
  private __activeSchedule: [ScheduleRenderData, number, number, number, number][] = []
  // private __scheduleMap: Map<number | string, ScheduleRenderData> = new Map()
  // private __renderMap: number | string | false [][] = [[]]
  private __mouseInSchedule: boolean = false
  private __lastSchedule: ScheduleRenderData | null = null

  constructor(renderer: Renderer) {
    super(renderer)

    this.__renderer.__loong.on('mouse-move', this.mouseMove, this)
    this.__renderer.__loong.on('mouse-click', this.click, this)
    this.__renderer.__loong.on('mouse-double-click', this.dblClick, this)
  }

  click(event: MouseEvent) {}

  dblClick(event: MouseEvent) {}

  mouseMove(event: MouseEvent) {
    const l = this.__showSchedule.length
    const calendarLT  = this.__renderer.calendarLT
    const cl = calendarLT[0]
    const ct = calendarLT[1]
    const mcx = this.__renderer.currentMouseX - cl
    const mcy = this.__renderer.currentMouseY - ct
    for (let i = 0; i < l; i++) {
      const schedule = this.__showSchedule[i]
      if (mcx >= schedule[1] && mcx <= schedule[1] + schedule[3] && mcy >= schedule[2] && mcy <= schedule[2] + schedule[4]) {
        this.__renderer.__loong.emit('render-mouse-move', event, schedule[0])
        if (this.__lastSchedule === schedule[0]) return
        this.__lastSchedule = schedule[0]
        this.__renderer.__loong.emit('render-data-in', schedule[0])
        this.__renderer.__loong.emit('force-render')
        // 此时已经完成重绘
        this.__renderer.__loong.emit('set-canvas-cursor-pointer', 'pointer')
        this.__mouseInSchedule = true
        return
      }
    }
    if (this.__lastSchedule) {
      this.__mouseInSchedule = false
      this.__lastSchedule = null
      this.__renderer.__loong.emit('force-render')
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const schedulePos = this.__renderer.gridLineRenderer.schedulePos
    this.__showSchedule = []
    const schedules = this.__activeSchedule.map((item) => item[0])
    this.__activeSchedule = []
    schedulePos.forEach((scheduleP) => {
      const dbtp = scheduleP[0].getTime()
      this.renderSchedules(ctx, scheduleP[0], dbtp, dbtp + scheduleP[1], dbtp + scheduleP[2], scheduleP[3], scheduleP[4])
    })
    const schedules2 = new Set(this.__activeSchedule.map((item) => item[0]))
    schedules.forEach((s) => {
      if (!schedules2.has(s)) {
        this.__renderer.__loong.emit('render-data-out', s)
      }
    })
    if (schedules2.size === 0) {
      this.__renderer.__loong.emit('set-canvas-cursor-pointer', 'default')
    }
  }

  private renderSchedules(
    ctx: CanvasRenderingContext2D,
    date: Date,
    dateBeginTimestamp: number,
    stratTimestamp: number,
    endTimestamp: number,
    left: number,
    width: number
  ) {
    const dayMS = 24 * 60 * 60 * 1000
    const fullHeight = this.__renderer.gridLineRenderer.calendarCurrentHeight
    const vw = this.__renderer.gridLineRenderer.calendarCurrentViewWidth
    const vh = this.__renderer.gridLineRenderer.calendarCurrentViewHeight
    const calendarLT  = this.__renderer.calendarLT
    const cl = calendarLT[0]
    const ct = calendarLT[1]
    const xOffset  = this.__renderer.gridLineRenderer.calendarCurrentXOffset
    const yOffset = this.__renderer.gridLineRenderer.calendarCurrentYOffset
    ctx.save()
    ctx.translate(cl, ct)
    ctx.beginPath()
    ctx.rect(0, 1, vw, vh - 1) // 裁剪区域
    ctx.clip() // 应用裁剪区域
    const schedules = this.__renderer.__loong.manager.getRenderData(date.toLocaleDateString())
    const l = schedules.length
    for (let i = 0; i < l; i++) {
      const schedule = schedules[i]
      const stp = schedule.startTimestamp
      const etp = schedule.endTimestamp
      if (etp < stratTimestamp) continue
      if (stp > endTimestamp) continue
      const timeYOffset = (stp - dateBeginTimestamp) / dayMS * fullHeight + yOffset
      const timeHeight = (etp - stp) / dayMS * fullHeight
      const timeLeft = schedule.left * width + left
      const timeWidth = schedule.width * width
      const mouseCX = this.__renderer.currentMouseX - cl
      const mouseCY = this.__renderer.currentMouseY - ct
      this.__showSchedule.push([schedule, timeLeft, timeYOffset, timeWidth, timeHeight])
      if (mouseCX >= timeLeft && mouseCX <= timeLeft + timeWidth && mouseCY >= timeYOffset && mouseCY <= timeYOffset + timeHeight) {
        this.__activeSchedule.push([schedule, timeLeft, timeYOffset, timeWidth, timeHeight])
      } else {
        this.renderShedule(ctx, schedule, timeLeft, timeYOffset, timeWidth, timeHeight)
      }
    }
    this.__activeSchedule.forEach((s) => {
      this.renderActiveShedule(ctx, s[0], s[1], s[2], s[3], s[4])
    })
    ctx.restore()
  }

  private renderShedule(
    ctx: CanvasRenderingContext2D,
    schedule: ScheduleRenderData,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const color = this.__renderer.__loong.options.getColor(schedule.schedule.category)
    ctx.fillStyle = this.lightenColor(color)
    this.drawCapsuleRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1)
    ctx.fillStyle = color
    this.drawCapsuleRect(ctx, x + 0.5, y + 0.5, 4, height - 1, 2)
    this.renderText(ctx, schedule, x, y, width, height)
  }

  private renderActiveShedule(
    ctx: CanvasRenderingContext2D,
    schedule: ScheduleRenderData,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const color = this.__renderer.__loong.options.getColor(schedule.schedule.category)
    ctx.fillStyle = color
    this.drawCapsuleOuterShadow(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 4, color + '50')
    ctx.fillStyle = 'white'
    this.renderText(ctx, schedule, x, y, width, height)
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    schedule: ScheduleRenderData,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.save()
    const title = schedule.schedule.title
    const content = schedule.schedule.content
    const startTime = schedule.schedule.startTime.toLocaleTimeString()
    const endTime = schedule.schedule.endTime.toLocaleTimeString()
    ctx.beginPath()
    ctx.rect(x + 5, y + 1, width - 8, height - 2) // 裁剪区域
    ctx.clip()
    // 渲染文字
    ctx.font = '18px Arial'
    ctx.fillText(title, x + 10, y + 18 + 2)
    ctx.font = '15px Arial'
    ctx.fillText(content, x + 10, y + 18 * 2 + 2)
    ctx.font = '12px Arial'
    ctx.fillText('Start: ' + startTime, x + 10, y + 18 * 3 + 2)
    ctx.fillText('End: ' + endTime, x + 10, y + 18 * 4 + 2)
    ctx.restore()
  }

  private lightenColor(hexColor: string): string {
    // 将十六进制颜色字符串转换为 RGB
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)

    // 定义亮度增加的量（可以根据需要调整）
    const increase = 0.9 // 亮度增加的比例

    // 计算新的 RGB 分量
    const newR = Math.floor(Math.min(255, r + (255 - r) * increase))
    const newG = Math.floor(Math.min(255, g + (255 - g) * increase))
    const newB = Math.floor(Math.min(255, b + (255 - b) * increase))

    // 将新的 RGB 分量转换回十六进制字符串
    const newHexColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`

    return newHexColor
  }
}
