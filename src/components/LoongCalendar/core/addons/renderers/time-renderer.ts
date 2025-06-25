import type { LoongCalendarTimeRendererOptions } from '../../../types'
import type { Renderer } from '../loong-addon-renderer'
import { RendererBase } from './renderer-base'

export class TimeRenderer extends RendererBase {
  readonly width: number = 80
  private __options: LoongCalendarTimeRendererOptions
  constructor(renderer: Renderer, options: LoongCalendarTimeRendererOptions) {
    super(renderer)
    this.width = options.timeWidth
    this.__options = options
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    const timeLT = this.__renderer.timeLT
    const timeRB = this.__renderer.timeRB
    const timeWidth = timeRB[0] - timeLT[0] - 1
    const timeHeight = timeRB[1] - timeLT[1] - 1
    const timeLines = this.__renderer.gridLineRenderer.timeLines
    ctx.translate(timeLT[0], timeLT[1])
    ctx.beginPath()
    ctx.rect(0, 0, timeWidth, timeHeight) // 裁剪区域
    ctx.clip() // 应用裁剪区域
    if (this.__options.backgroundColor !== '' && this.__options.backgroundColor !== 'transparent') {
      ctx.fillStyle = this.__options.backgroundColor
      ctx.fillRect(0, 0, timeWidth, timeHeight)
    }
    // 设置文字样式
    ctx.font = `${this.__options.fontSize}px ${this.__options.fontFamily}`
    ctx.fillStyle = this.__options.color
    timeLines.forEach((data) => {
      const [y, text] = data
      ctx.fillText(text, 7, y + 16)
    })
    ctx.restore()
  }
  destroy(): void {

  }
}
