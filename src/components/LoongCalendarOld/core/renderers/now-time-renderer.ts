import { RendererBase } from './renderer-base'

export class NowTimeRenderer extends RendererBase {
  render(ctx: CanvasRenderingContext2D): void {
    const now = new Date()
    const time = now.toLocaleTimeString()
    const seconds = now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const fullSeconds = 1000 * 60 * 60 * 24
    const calendarCurrentHeight = this.__renderer.gridLineRenderer.calendarCurrentHeight
    const calendarCurrentYOffset = this.__renderer.gridLineRenderer.calendarCurrentYOffset
    const calendarCurrentViewWidth = this.__renderer.gridLineRenderer.calendarCurrentViewWidth
    const calendarCurrentViewHeight = this.__renderer.gridLineRenderer.calendarCurrentViewHeight
    const calendarLT  = this.__renderer.calendarLT
    const cl = calendarLT[0]
    const ct = calendarLT[1]
    const pos = seconds / fullSeconds * calendarCurrentHeight
    const y = calendarCurrentYOffset + pos
    if (y <= -20 || y >= calendarCurrentViewHeight + 20) return
    const lineX = this.__renderer.timeRenderer.width
    ctx.save()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(79, 173, 255, 1)'
    ctx.fillStyle = 'rgba(79, 173, 255, 1)'
    ctx.save()
    ctx.translate(cl, ct)
    ctx.beginPath()
    ctx.rect(0, 1, calendarCurrentViewWidth, calendarCurrentViewHeight - 1) // 裁剪区域
    ctx.clip() // 应用裁剪区域
    ctx.translate(-cl, 0)
    // 绘制线条
    ctx.beginPath()
    ctx.moveTo(lineX, y)
    ctx.lineTo(calendarCurrentViewWidth + lineX, y)
    ctx.stroke()
    // 绘制左侧三角形
    ctx.beginPath()
    ctx.moveTo(lineX, y - 7) // 第一个顶点
    ctx.lineTo(lineX + 10, y) // 第二个顶点
    ctx.lineTo(lineX, y + 7) // 第三个顶点
    ctx.closePath()
    ctx.fill()
    // 绘制右侧三角形
    ctx.beginPath()
    ctx.moveTo(calendarCurrentViewWidth + lineX, y - 7) // 第一个顶点
    ctx.lineTo(calendarCurrentViewWidth + lineX - 10, y) // 第二个顶点
    ctx.lineTo(calendarCurrentViewWidth + lineX, y + 7) // 第三个顶点
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.translate(0, this.__renderer.dayRenderer.height)
    // 绘制矩形
    const w = this.__renderer.timeRenderer.width
    this.drawCapsuleRect(ctx, 5, y - 9, w - 10, 18, 5)
    // 绘制时间
    ctx.font = '16px Arial'
    ctx.fillStyle = 'white'
    ctx.fillText(time, 8, y + 6)
    ctx.restore()
  }
}
