import {
  computed,
  ref,
  watch,
  type ComputedRef,
  type Ref,
  type WatchHandle,
  type WritableComputedRef
} from 'vue'
import type { LoongCalendar } from '..'
import { LoongAddon } from './loong-addon'
import type { CalendarSchedule, TimeRange } from './schedule'

export class ScheduleRenderData {
  readonly schedule: CalendarSchedule
  readonly timeRange: TimeRange
  readonly draw: boolean
  readonly startTimestamp: number
  readonly endTimestamp: number
  /**
   * 宽度，单位：%，去renderer里面计算具体的px
   */
  width: number = 0
  /**
   * 高度（duration），单位：s，去renderer里面计算具体的px
   */
  height: number = 0
  /**
   * 顶部位置（startTime），单位：s，去renderer里面计算具体的px
   */
  top: number = 0
  /**
   * 左侧位置，单位：%，去renderer里面计算具体的px
   */
  left: number = 0
  /**
   * 第几列
   */
  colIndex: number = 1
  /**
   * 共几列
   */
  colAmount: number = 1
  /**
   * 占几列
   */
  hasColAmount: number = 1
  constructor(schedule: CalendarSchedule, timeRange: TimeRange, draw: boolean = true) {
    this.schedule = schedule
    this.timeRange = timeRange
    this.startTimestamp = timeRange.startTimestamp
    this.endTimestamp = timeRange.endTimestamp
    this.draw = draw
  }
}

export class ScheduleMap extends Map<string, CalendarSchedule> {
  private __scheduleList: CalendarSchedule[] = []

  private sort() {
    this.__scheduleList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  set(key: string, value: CalendarSchedule) {
    this.__scheduleList.push(value)
    this.sort()
    return super.set(key, value)
  }

  delete(key: string): boolean {
    this.__scheduleList = this.__scheduleList.filter((schedule) => schedule.id !== key)
    return super.delete(key)
  }

  search(startTime: Date, endTime: Date): CalendarSchedule[] {
    const res = []
    for (const schedule of this.__scheduleList) {
      if (
        schedule.startTime.getTime() >= startTime.getTime() &&
        schedule.startTime.getTime() <= endTime.getTime()
      ) {
        res.push(schedule)
      }
      if (schedule.startTime.getTime() > endTime.getTime()) break
    }
    return res
  }
}

export class TimeRangeMap extends Map<string, TimeRange[]> {
  private sort(list: TimeRange[]) {
    list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  private setTimeRange(key: string, value: TimeRange) {
    if (!this.has(key)) super.set(key, [])
    const list = super.get(key) as TimeRange[]
    list.push(value)
    this.sort(list)
    return super.set(key, list)
  }

  private deleteTimeRange(key: string, value: TimeRange) {
    if (!this.has(key)) return false
    const list = super.get(key) as TimeRange[]
    const i = list.indexOf(value)
    if (i === -1) return false
    list.splice(list.indexOf(value), 1)
    super.set(key, list)
    return true
  }

  add(schedule: CalendarSchedule): this {
    const timeRangeList = schedule.timeRangeList
    for (const timeRange of timeRangeList) {
      this.setTimeRange(timeRange.day, timeRange)
    }
    return this
  }

  remove(schedule: CalendarSchedule): boolean {
    const timeRangeList = schedule.timeRangeList
    let res = true
    for (const timeRange of timeRangeList) {
      res = this.deleteTimeRange(timeRange.day, timeRange) && res
    }
    return res
  }
}

export function getSundayOfTheWeek(date: Date): Date {
  const tempDate = new Date(date)
  const dayOfWeek = tempDate.getDay()
  tempDate.setDate(tempDate.getDate() - dayOfWeek)
  const day = new Date(tempDate.getTime())
  day.setHours(0, 0, 0, 0)
  return day
}

export function now() {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  return day
}

export class Manager extends LoongAddon {
  private __scheduleMap: ScheduleMap = new ScheduleMap()
  private __timeRangeMap: TimeRangeMap = new TimeRangeMap()
  private __renderDataMap: Map<string, ScheduleRenderData[]> = new Map()

  readonly type: Ref<'date' | 'week'> = ref('week')
  /**
   * 在type为date下渲染的日期
   */
  readonly renderDay: Ref<Date> = ref(now())
  /**
   * 在type为week下渲染的周的周天
   */
  readonly renderWeek: Ref<Date> = ref(getSundayOfTheWeek(new Date()))
  /**
   * 给controller日期选择器的value
   */
  readonly controllerValue: WritableComputedRef<Date, Date> = computed({
    get: () => {
      if (this.type.value === 'date') {
        return this.renderDay.value
      } else {
        return this.renderWeek.value
      }
    },
    set: (value: Date) => {
      if (this.type.value === 'date') {
        this.renderDay.value = value
      } else {
        this.renderWeek.value = value
      }
    }
  })
  /**
   * 给renderer渲染的日期数据 day
   */
  readonly rendererDay: ComputedRef<Date> = computed(() => {
    return this.renderDay.value
  })
  /**
   * 给renderer渲染的日期数据 week
   */
  readonly rendererWeek: ComputedRef<Date[]> = computed(() => {
    const sunday = this.renderWeek.value
    const res = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday.getTime())
      day.setDate(day.getDate() + i)
      res.push(day)
    }
    return res
  })

  private __typeWatcher: WatchHandle
  private __dayWatcher: WatchHandle
  private __weekWatcher: WatchHandle

  constructor(calendar: LoongCalendar) {
    super(calendar)

    this.__loong.on('data-update', this.updateRenderData, this)
    this.__loong.on('reset', this.reset, this)
    this.__typeWatcher = watch(this.type, () => {
      this.__loong.emit('render-type-change', this.type.value)
    })
    this.__dayWatcher = watch(this.renderDay, (newVal: Date, oldVal: Date) => {
      this.__loong.emit('render-data-update')
      this.__loong.emit('render-time-range-change', 'date', newVal, oldVal)
    })
    this.__weekWatcher = watch(this.renderWeek, (newVal: Date, oldVal: Date) => {
      this.__loong.emit('render-data-update')
      this.__loong.emit('render-time-range-change', 'week', newVal, oldVal)
    })
  }

  protected reset() {
    this.type.value = 'week'
    this.renderDay.value = now()
    this.renderWeek.value = getSundayOfTheWeek(new Date())
    this.__scheduleMap.clear()
    this.__timeRangeMap.clear()
    this.__renderDataMap.clear()
    this.__loong.emit('render-data-update')
  }

  protected destroy(): void {
    this.__loong.off('data-update', this.updateRenderData, this)
    this.__scheduleMap.clear()
    this.__timeRangeMap.clear()
    this.__renderDataMap.clear()
    this.__typeWatcher.stop()
    this.__dayWatcher.stop()
    this.__weekWatcher.stop()
  }

  addSchedule(schedule: CalendarSchedule): this {
    if (this.__scheduleMap.has(schedule.id)) return this
    this.__scheduleMap.set(schedule.id, schedule)
    this.__timeRangeMap.add(schedule)
    this.__loong.emit('data-update', 'add', [schedule])
    return this
  }

  addScheduleList(scheduleList: CalendarSchedule[]): this {
    const t: CalendarSchedule[] = []
    scheduleList.forEach((schedule) => {
      if (this.__scheduleMap.has(schedule.id)) return
      this.__scheduleMap.set(schedule.id, schedule)
      this.__timeRangeMap.add(schedule)
      t.push(schedule)
    })
    this.__loong.emit('data-update', 'add', t)
    return this
  }

  removeSchedule(id: string): boolean {
    const sch = this.__scheduleMap.get(id)
    if (sch === undefined) return false
    const res = this.__scheduleMap.delete(id)
    this.__timeRangeMap.remove(sch)
    if (res) this.__loong.emit('data-update', 'remove', [sch])
    return res
  }

  getSchedule(id: string): CalendarSchedule | undefined {
    return this.__scheduleMap.get(id)
  }

  getSchedules(startTime: Date, endTime: Date): CalendarSchedule[] {
    return this.__scheduleMap.search(startTime, endTime)
  }

  getRenderData(key: string): ScheduleRenderData[] {
    return this.__renderDataMap.get(key) || []
  }

  /**
   * 数据发生变化后调用此函数，计算页面数据进行布局，此时数据是已经添加or删除的
   */
  private updateRenderData(method: 'add' | 'remove', schedules: CalendarSchedule[]) {
    if (schedules.length === 0) return
    const set = new Set<string>()
    schedules.forEach((schedule) => {
      schedule.timeRangeList.forEach((timeRange) => {
        set.add(timeRange.day)
      })
    })
    set.forEach((day) => {
      this.calculateRenderData(day)
    })
    this.__loong.emit('render-data-update')
  }

  /**
   * 计算渲染尺寸
   * @param key 日期 2025-01-01
   */
  private calculateRenderData(key: string) {
    // 已经按照起始时刻排好序
    const timeRangeList = this.__timeRangeMap.get(key)
    if (timeRangeList === undefined) return
    type MeetingColumeData = ScheduleRenderData[] // 最晚结束的排在最前
    type MeetingGroupData = MeetingColumeData[]
    type FullMeetingData = MeetingGroupData[]
    const meetings: FullMeetingData = [[[]]]
    let colAmount = 1
    timeRangeList.forEach((timeRange) => {
      const renderData = new ScheduleRenderData(timeRange.schedule, timeRange)
      const lastMeetingGroup = meetings[meetings.length - 1]
      const length = lastMeetingGroup.length
      // 因为colume是最晚结束的排在最前，所以此时排完group的顺序就是结束时间从早到晚
      lastMeetingGroup.sort((a, b) => a[0].endTimestamp - b[0].endTimestamp)
      // 此时的renderData是否还是在lastGroup中
      let inside = false
      // 最大结束时间大于当前开始时间，有时间重叠
      if (
        length > 0 &&
        lastMeetingGroup[length - 1].length > 0 &&
        lastMeetingGroup[length - 1][0].endTimestamp > renderData.startTimestamp
      ) { inside = true }
      if (inside) {
        // 是否需要新的一列（不可以直接插入）
        let needANewColume = false
        // 最小结束时间大于当前开始时间，无法直接插入，需要新增一列
        if (lastMeetingGroup[0][0].endTimestamp > renderData.startTimestamp) needANewColume = true
        if (needANewColume) {
          // 列数加一
          colAmount++
          renderData.colIndex = colAmount
          renderData.colAmount = colAmount
          // 为本组全部成员重新设置列数
          lastMeetingGroup.forEach((g) => {
            g.forEach((m) => {
              m.colAmount = colAmount
            })
          })
          // 向本组增加一列
          lastMeetingGroup.push([renderData])
        } else {
          renderData.colAmount = colAmount
          renderData.colIndex = lastMeetingGroup[0][0].colIndex // 这两者是同一列的
          lastMeetingGroup[0].unshift(renderData) // 插入最先结束的组
        }
      } else {
        // 如果group为空，则push
        if (length === 0) lastMeetingGroup[0].push(renderData)
        else {
          // 创建新的group
          colAmount = 1
          const newFroup: MeetingGroupData = [[renderData]]
          meetings.push(newFroup)
        }
      }
    })
    // 现在所有的数据都已经安排好位置
    // 检查每一条数据的宽度
    // 先检查数据左侧是否有空间
    // 然后检查数据右侧是否有空间
    meetings.forEach((group) => {
      // 对组里面的列排序
      group.sort((a, b) => a[0].colIndex - b[0].colIndex)
      // 本轮检查左侧
      group.forEach((column, ci) => {
        column.forEach((renderData) => {
          if (!renderData.draw) return
          const startTimestamp = renderData.startTimestamp
          const endTimestamp = renderData.endTimestamp
          const renderDataColAmount = renderData.colAmount
          let nowColumeIndex = ci
          while (
            nowColumeIndex > 0 &&
            group[nowColumeIndex - 1].findIndex((rd) => {
              if (rd.startTimestamp <= startTimestamp && rd.endTimestamp > startTimestamp) { return true } else if (rd.endTimestamp >= endTimestamp && rd.startTimestamp < endTimestamp) { return true } else if (rd.startTimestamp >= startTimestamp && rd.endTimestamp <= endTimestamp) { return true }
              return false
            }) === -1
          ) {
            nowColumeIndex--
          }
          // 塞入占位数据
          for (let i = nowColumeIndex; i < ci; i++) {
            group[i].push(new ScheduleRenderData(renderData.schedule, renderData.timeRange, false))
          }
          // 更新数据
          // 左侧如果有空间，可以向左扩张
          renderData.left = nowColumeIndex / renderDataColAmount // 实际用的
          // renderData.left = ci / renderDataColAmount // 不进行计算的
          // 宽度也对应变化，具体width在计算右侧空间时再算
          renderData.hasColAmount = ci - nowColumeIndex + 1 // 实际用的
          // renderData.hasColAmount = 1 // 不进行计算的
        })
      })
      // 本轮检查右侧
      group.forEach((column, ci) => {
        const columeAmount = group.length
        column.forEach((renderData) => {
          if (!renderData.draw) return
          const startTimestamp = renderData.startTimestamp
          const endTimestamp = renderData.endTimestamp
          let nowColumeIndex = ci
          while (
            nowColumeIndex < columeAmount - 1 &&
            group[nowColumeIndex + 1].findIndex((rd) => {
              if (rd.startTimestamp <= startTimestamp && rd.endTimestamp > startTimestamp) { return true } else if (rd.endTimestamp >= endTimestamp && rd.startTimestamp < endTimestamp) { return true } else if (rd.startTimestamp >= startTimestamp && rd.endTimestamp <= endTimestamp) { return true }
              return false
            }) === -1
          ) {
            nowColumeIndex++
          }
          // 塞入占位数据
          for (let i = ci + 1; i <= nowColumeIndex; i++) {
            group[i].push(new ScheduleRenderData(renderData.schedule, renderData.timeRange, false))
          }
          // 更新数据
          // 宽度也对应变化，具体width在计算右侧空间时再算
          renderData.hasColAmount = nowColumeIndex - ci + renderData.hasColAmount // 实际用的
          // renderData.hasColAmount = renderData.hasColAmount // 不进行计算的
          renderData.width = renderData.hasColAmount / renderData.colAmount // 实际用的
        })
      })
    })
    // 将所有数据展平
    const allRenderData = meetings.flat(2)
    // 过滤掉draw不为true的
    const useRenderData = allRenderData.filter((rd) => rd.draw)
    this.__renderDataMap.set(key, useRenderData)
  }
}
