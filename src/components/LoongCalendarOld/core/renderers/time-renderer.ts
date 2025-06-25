import { RendererBase } from './renderer-base'

export class TimeRenderer extends RendererBase {
  readonly width = 80
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    const timeLT = this.__renderer.timeLT
    const timeRB = this.__renderer.timeRB
    const timeWidth = timeRB[0] - timeLT[0] - 3
    const timeHeight = timeRB[1] - timeLT[1] - 3
    const timeLines = this.__renderer.gridLineRenderer.timeLines
    ctx.translate(timeLT[0], timeLT[1])
    ctx.beginPath()
    ctx.rect(0, 0, timeWidth, timeHeight) // 裁剪区域
    ctx.clip() // 应用裁剪区域
    // 设置文字样式
    ctx.font = '16px Arial'
    ctx.fillStyle = 'black'
    timeLines.forEach((data) => {
      const [y, text] = data
      ctx.fillText(text, 7, y + 16)
    })
    ctx.restore()
  }
}
