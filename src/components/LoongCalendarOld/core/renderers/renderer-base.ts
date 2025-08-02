import type { Renderer } from '../loong-addon-renderer'

export abstract class RendererBase {
  protected readonly __renderer: Renderer

  constructor(renderer: Renderer) {
    this.__renderer = renderer
  }

  xCanZoomIn(): boolean {
    return true
  }

  xCanZoomOut(): boolean {
    return true
  }

  yCanZoomIn(): boolean {
    return true
  }

  yCanZoomOut(): boolean {
    return true
  }

  abstract render(ctx: CanvasRenderingContext2D): void

  drawCapsuleRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number = 4) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    // 右上角弧线
    ctx.arcTo(x + w, y, x + w, y + r, r)
    // 右下角弧线
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    // 左下角弧线
    ctx.arcTo(x, y + h, x, y + h - r, r)
    // 左上角弧线
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  drawCapsuleOuterShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number = 4,
    shadowColor: string = 'rgba(79, 173, 255, 1)', // 阴影颜色
    shadowBlur: number = 8, // 模糊级别，越大越模糊，阴影范围也越大。
    lineWidth: number = 0.5 // 边框越大，阴影越清晰
  ) {
    ctx.save()
    ctx.beginPath()
    // 裁剪区(只保留内部阴影部分)
    // roundRect(ctx, x, y, w, h, r);
    // ctx.clip();
    ctx.strokeStyle = shadowColor
    // 边框+阴影
    ctx.beginPath()
    ctx.lineWidth = lineWidth
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = shadowBlur
    // 因线是由坐标位置向两则画的，所以要移动起点坐标位置，和加大矩形。
    ctx.stroke()
    this.drawCapsuleRect(
      ctx,
      x,
      y,
      w,
      h,
      r
    )

    // 取消阴影
    ctx.shadowBlur = 0

    ctx.restore()
  }
}
