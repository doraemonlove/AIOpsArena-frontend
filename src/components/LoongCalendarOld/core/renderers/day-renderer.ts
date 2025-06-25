import { RendererBase } from './renderer-base'

function formatDate(date: Date): string {
  const tdate = new Date(date)
  const month = String(tdate.getMonth() + 1).padStart(2, '0')
  const day = String(tdate.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

export class DayRenderer extends RendererBase {
  readonly height = 60
  readonly days: string[] = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
  render(ctx: CanvasRenderingContext2D): void {
    const type = this.__renderer.__loong.manager.type.value
    const rendererDay = this.__renderer.__loong.manager.rendererDay.value
    const rendererWeek = this.__renderer.__loong.manager.rendererWeek.value
    ctx.save()
    ctx.lineWidth = 1
    const dayLT = this.__renderer.dayLT
    const dayRB = this.__renderer.dayRB
    const dayLines = this.__renderer.gridLineRenderer.dayLines
    const dayWidth = dayRB[0] - dayLT[0]
    const dayHeight = dayRB[1] - dayLT[1]
    ctx.translate(dayLT[0], dayLT[1])
    ctx.beginPath()
    ctx.rect(-1, -1, dayWidth + 2, dayHeight + 2) // 裁剪区域
    ctx.clip() // 应用裁剪区域
    ctx.fillStyle = 'rgb(245, 247, 249)'
    ctx.fillRect(0, 1, dayWidth - 1, dayHeight - 1)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.beginPath()
    ctx.moveTo(0, 1)
    ctx.lineTo(dayWidth, 1)
    ctx.stroke()
    for (let i = 0; i < dayLines.length; i++) {
      const dayLine = dayLines[i]
      ctx.beginPath()
      ctx.moveTo(dayLine[0], 1)
      ctx.lineTo(dayLine[0], dayHeight)
      ctx.stroke()
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.font = 'bold 18px Arial'
      ctx.fillText(this.days[i], dayLine[0] + 5, 18 + 5)
      if (type === 'week') {
        ctx.fillText(formatDate(rendererWeek[i]), dayLine[0] + 5, 18 + 18 + 13)
      } else {
        ctx.fillText(formatDate(rendererDay), dayLine[0] + 5, 18 + 18 + 13)
      }
    }
    if (dayLines[0][0] !== 0) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, dayHeight)
      ctx.stroke()
    }
    ctx.restore()
  }
}
