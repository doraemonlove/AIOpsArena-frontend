
export class TimeRange {
  readonly schedule: CalendarSchedule
  readonly startTime: Date
  readonly endTime: Date
  readonly startTimestamp: number
  readonly endTimestamp: number
  readonly day: string

  constructor(schedule: CalendarSchedule, startTime: Date, endTime: Date) {
    this.schedule = schedule
    this.startTime = startTime
    this.endTime = endTime
    this.startTimestamp = startTime.getTime()
    this.endTimestamp = endTime.getTime()
    this.day = startTime.toLocaleDateString()
  }
}

export class CalendarSchedule {
  readonly timeRangeList: TimeRange[] = []
  constructor(
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly title: string,
    public readonly content: string,
    public readonly category: string | number,
    public readonly id: string,
    public readonly meta: any
  ) {
    this.init()
  }

  private init() {
    this.splitTimeByDay(this.startTime, this.endTime)
  }

  private splitTimeByDay(startTime: Date, endTime: Date) {
  // 检查开始时间是否早于结束时间
    if (startTime > endTime) {
      throw new Error('Start time must be before end time')
    }
    let currentStart = new Date(startTime)

    while (currentStart < endTime) {
      // 计算当天的结束时间（23:59:59）
      const currentEnd = new Date(currentStart)
      currentEnd.setHours(23, 59, 59, 999)

      // 如果当天的结束时间超过了总结束时间，调整为总结束时间
      if (currentEnd > endTime) {
        currentEnd.setTime(endTime.getTime())
      }

      // 添加当前时间区间到结果数组
      this.timeRangeList.push(new TimeRange(this, currentStart, currentEnd))

      // 更新下一天的开始时间
      currentStart = new Date(currentStart)
      currentStart.setDate(currentStart.getDate() + 1)
      currentStart.setHours(0, 0, 0, 0) // 设置为下一天的 00:00:00
    }
  }
}
