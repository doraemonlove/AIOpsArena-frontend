import type { ScheduleRenderData } from '../core/loong-addon-manager'
import type { CalendarSchedule } from '../core/schedule'
export * from './options'

export interface LoongEvents {
  'destory': []
  // loong calendar 销毁事件
  'canvas-x-zoom-in': []
  'canvas-x-zoom-out': []
  'canvas-y-zoom-in': []
  'canvas-y-zoom-out': []
  // x y 轴上的放缩事件
  'canvas-online': []
  'canvas-offline': []
  // canvas 出现在页面上事件和消失事件
  'resize': []
  // window resize
  'reset-color': []
  // 重新设置颜色
  'mouse-move': [MouseEvent]
  'mouse-in': []
  'mouse-out': []
  'mouse-down': [MouseEvent]
  'mouse-up': [MouseEvent]
  'mouse-click': [MouseEvent]
  'mouse-double-click': [MouseEvent]
  // 鼠标事件
  'one-second-passed': []
  // 过了一秒
  'force-render': []
  // 渲染
  'scroll-up': []
  'scroll-down': []
  // 滚动事件
  'data-update': ['add' | 'remove', CalendarSchedule[]]
  // 数据更新
  'render-time-range-change': ['date' | 'week', Date, Date]
  // 渲染时间范围改变
  'render-data-update': []
  // 渲染的数据更新（可能是增加or删除数据，也可能是切换日期or周）
  'render-type-change': ['date' | 'week']
  // 渲染类型改变
  'render-data-in': [ScheduleRenderData]
  'render-data-out': [ScheduleRenderData]
  'render-mouse-move': [MouseEvent, ScheduleRenderData]
  // 渲染鼠标浮动
  'reset': []
  // 清除所有数据，恢复默认状态
  'set-canvas-cursor-pointer': ['default' | 'pointer' | 'move' | 'grabbing']
  // 修改鼠标浮动在canvas上的图标
}
