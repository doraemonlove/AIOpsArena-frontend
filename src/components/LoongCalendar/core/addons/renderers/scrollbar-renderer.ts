import type { LoongCalendarScrollbarRendererOptions } from '../../../types'
import { RendererBase } from './renderer-base'
import type { Renderer } from '../loong-addon-renderer'

export class ScrollbarRenderer extends RendererBase {
  readonly size: number = 10
  private __hThumbL: number = 0
  private __hThumbT: number = 0
  private __hThumbW: number = 0
  private __hThumbH: number = 0
  private __hScrollbarW: number = 0
  private __vThumbL: number = 0
  private __vThumbT: number = 0
  private __vThumbW: number = 0
  private __vThumbH: number = 0
  private __vScrollbarH: number = 0
  private __mouseDownH = false
  private __mouseDownV = false
  private __mouseX = 0
  private __mouseY = 0

  private __options: LoongCalendarScrollbarRendererOptions

  constructor(renderer: Renderer, options: LoongCalendarScrollbarRendererOptions) {
    super(renderer)
    this.size = options.scrollbarSize
    this.__options = options
  }

  destroy(): void {

  }

  render(ctx: CanvasRenderingContext2D): void {
    const xOffset = this.__renderer.gridLineRenderer.calendarCurrentXOffset
    const yOffset = this.__renderer.gridLineRenderer.calendarCurrentYOffset
    const calCWidth = this.__renderer.gridLineRenderer.calendarCurrentWidth
    const calCHeight = this.__renderer.gridLineRenderer.calendarCurrentHeight
    const calVWidth = this.__renderer.gridLineRenderer.calendarCurrentViewWidth
    const calVHeight = this.__renderer.gridLineRenderer.calendarCurrentViewHeight
    const verticalScrollbarLT = this.__renderer.verticalScrollbarLT
    const verticalScrollbarRB = this.__renderer.verticalScrollbarRB
    const horizontalScrollbarLT = this.__renderer.horizontalScrollbarLT
    const horizontalScrollbarRB = this.__renderer.horizontalScrollbarRB
    const horizontalScrollWidth = horizontalScrollbarRB[0] - horizontalScrollbarLT[0]
    const verticalScrollHeight = verticalScrollbarRB[1] - verticalScrollbarLT[1]
    // console.log(xOffset, calCWidth, calVWidth)
    ctx.save()
    if (calCWidth > calVWidth && this.__renderer.__loong.manager.type.value === 'week') {
      ctx.fillStyle = this.__options.backgroundColor
      // 画水平滚动条
      this.drawCapsuleRect(
        ctx,
        horizontalScrollbarLT[0] + 1,
        horizontalScrollbarLT[1] + 1,
        horizontalScrollbarRB[0] - horizontalScrollbarLT[0],
        this.size - 2,
        2)
      ctx.fillStyle = this.__options.thumbColor
      // 画水平滚动条滑块
      const hThumbWidth = calVWidth / calCWidth * horizontalScrollWidth
      const hThumbLeft = Math.abs(xOffset) / calCWidth * horizontalScrollWidth
      this.drawCapsuleRect(
        ctx,
        horizontalScrollbarLT[0] + 1 + hThumbLeft,
        horizontalScrollbarLT[1] + 1,
        hThumbWidth,
        this.size - 2,
        2)
      this.__hScrollbarW = horizontalScrollbarRB[0] - horizontalScrollbarLT[0]
      this.__hThumbL = horizontalScrollbarLT[0] + 1 + hThumbLeft
      this.__hThumbT = horizontalScrollbarLT[1] + 1
      this.__hThumbW = hThumbWidth
      this.__hThumbH = this.size - 2
    }
    ctx.fillStyle = this.__options.backgroundColor
    // 画垂直滚动条
    this.drawCapsuleRect(
      ctx,
      verticalScrollbarLT[0] + 1,
      verticalScrollbarLT[1] + 1,
      this.size - 2,
      verticalScrollbarRB[1] - verticalScrollbarLT[1],
      2)
    ctx.fillStyle = this.__options.thumbColor
    // 画垂直滚动条滑块
    const vThumbHeight = calVHeight / calCHeight * verticalScrollHeight
    const useVThumbHeight = Math.max(vThumbHeight, 30)
    const useVerticalScrollHeight = useVThumbHeight !== vThumbHeight ? verticalScrollHeight - (30 - vThumbHeight) : verticalScrollHeight
    const vThumbTop = Math.abs(yOffset) / calCHeight * useVerticalScrollHeight
    this.drawCapsuleRect(
      ctx,
      verticalScrollbarLT[0] + 1,
      verticalScrollbarLT[1] + 1 + vThumbTop,
      this.size - 2,
      useVThumbHeight,
      4)
    this.__vScrollbarH = verticalScrollbarRB[1] - verticalScrollbarLT[1]
    this.__vThumbL =  verticalScrollbarLT[0] + 1
    this.__vThumbT = verticalScrollbarLT[1] + 1 + vThumbTop
    this.__vThumbW = this.size - 2
    this.__vThumbH = useVThumbHeight
    ctx.restore()
  }

  downInHThumb(event: MouseEvent) {
    const x = event.offsetX
    const y = event.offsetY
    if (x >= this.__hThumbL && x <= this.__hThumbL + this.__hThumbW && y >= this.__hThumbT && y <= this.__hThumbT + this.__hThumbH) {
      this.__mouseDownH = true
    }
  }

  downInVThumb(event: MouseEvent) {
    const x = event.offsetX
    const y = event.offsetY
    if (x >= this.__vThumbL && x <= this.__vThumbL + this.__vThumbW && y >= this.__vThumbT && y <= this.__vThumbT + this.__vThumbH) {
      this.__mouseDownV = true
    }
  }

  mouseMove(event: MouseEvent) {
    const diffX = -(event.offsetX - this.__mouseX)
    const diffY = -(event.offsetY - this.__mouseY)
    this.__mouseX = event.offsetX
    this.__mouseY = event.offsetY
    if (this.__mouseDownH) {
      const offsetX = diffX / this.__hScrollbarW * this.__renderer.gridLineRenderer.calendarCurrentWidth
      this.__renderer.updateOffset(offsetX, 0)
    }
    if (this.__mouseDownV) {
      const offsetY = diffY / this.__vScrollbarH * this.__renderer.gridLineRenderer.calendarCurrentHeight
      this.__renderer.updateOffset(0, offsetY)
    }
  }

  mouseUp() {
    this.__mouseDownH = false
    this.__mouseDownV = false
  }
}
