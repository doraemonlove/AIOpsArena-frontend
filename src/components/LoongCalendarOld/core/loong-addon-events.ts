import type { LoongCalendar } from '..'
import { LoongAddon } from './loong-addon'

export class Events extends LoongAddon {
  private __canvas: HTMLCanvasElement | null = null

  private __vIsDown = false
  private __hIsDown = false

  private __mouseIn = () => { this.__loong.emit('mouse-in') }
  private __mouseOut = () => { this.__loong.emit('mouse-out') }
  private __mouseMouve = (event: MouseEvent) => { this.__loong.emit('mouse-move', event) }
  private __mouseDown = (event: MouseEvent) => { this.__loong.emit('mouse-down', event) }
  private __mouseUp = (event: MouseEvent) => { this.__loong.emit('mouse-up', event) }
  private __mouseClick = (event: MouseEvent) => { this.__loong.emit('mouse-click', event) }
  private __mouseDoubleClick = (event: MouseEvent) => { this.__loong.emit('mouse-double-click', event) }

  private __keyDown = (event: KeyboardEvent) => {
    if (event.key === 'h') {
      this.__hIsDown = true
    }
    if (event.key === 'v') {
      this.__vIsDown = true
    }
    if (event.key === '=' && this.__vIsDown) {
      this.__loong.emit('canvas-y-zoom-in')
    }
    if (event.key === '-' && this.__vIsDown) {
      this.__loong.emit('canvas-y-zoom-out')
    }
    if (event.key === '=' && this.__hIsDown) {
      this.__loong.emit('canvas-x-zoom-in')
    }
    if (event.key === '-' && this.__hIsDown) {
      this.__loong.emit('canvas-x-zoom-out')
    }
  }

  private __keyUp = (event: KeyboardEvent) => {
    if (event.key === 'h') {
      this.__hIsDown = false
    }
    if (event.key === 'v') {
      this.__vIsDown = false
    }
  }

  private __wheel = (event: WheelEvent) => {
    if (event.target !== this.__canvas) return
    if (this.__hIsDown) {
      event.preventDefault()
      // 水平缩放
      if (event.deltaY < 0) {
        this.__loong.emit('canvas-x-zoom-in')
      } else {
        this.__loong.emit('canvas-x-zoom-out')
      }
    } else if (this.__vIsDown) {
      event.preventDefault()
      // 垂直缩放
      if (event.deltaY < 0) {
        this.__loong.emit('canvas-y-zoom-in')
      } else {
        this.__loong.emit('canvas-y-zoom-out')
      }
    } else {
      // 滚动
      if (event.deltaY < 0) {
        this.__loong.emit('scroll-up')
      } else {
        this.__loong.emit('scroll-down')
      }
    }
  }

  constructor(loong: LoongCalendar) {
    super(loong)

    this.__loong.on('canvas-online', this.canvasOnline, this)
    this.__loong.on('canvas-offline', this.canvasOffline, this)
  }

  private canvasOnline() {
    const canvas = document.getElementById(this.__loong.id) as HTMLCanvasElement
    this.__canvas = canvas
    canvas.addEventListener('mousemove', this.__mouseMouve)
    canvas.addEventListener('mousedown', this.__mouseDown)
    canvas.addEventListener('mouseup', this.__mouseUp)
    window.addEventListener('mouseup', this.__mouseUp)
    canvas.addEventListener('click', this.__mouseClick)
    canvas.addEventListener('mouseenter', this.__mouseIn)
    canvas.addEventListener('mouseleave', this.__mouseOut)
    window.addEventListener('keydown', this.__keyDown)
    window.addEventListener('keyup', this.__keyUp)
    window.addEventListener('wheel', this.__wheel, { passive: false })
    canvas.addEventListener('dblclick', this.__mouseDoubleClick)
    this.__loong.on('set-canvas-cursor-pointer', this.setCanvasCursorPointer, this)
  }

  private canvasOffline() {
    this.__canvas = null
    window.removeEventListener('mouseup', this.__mouseUp)
    window.removeEventListener('keydown', this.__keyDown)
    window.removeEventListener('keyup', this.__keyUp)
    window.removeEventListener('wheel', this.__wheel)
  }

  private setCanvasCursorPointer = (cursor: string) => {
    if (this.__canvas) {
      this.__canvas.style.cursor = cursor
    }
  }

  protected destroy(): void {}
}
