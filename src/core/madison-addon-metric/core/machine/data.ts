import { watch, type WatchHandle } from 'vue'
import type { MachineMetricRes } from '../../types'
import * as echarts from 'echarts'
import type { Madison } from '@/core/madison/core'

export class MetricDataManager {
  /**
   * <metricName, >
   */
  private __metricDataMap: Map<string, MetricData> = new Map()
  private __madison: Madison

  constructor(metricName: string[], madison: Madison) {
    metricName.forEach((metricName) => {
      this.__metricDataMap.set(metricName, new MetricData(metricName, this.__madison))
    })
    this.__madison = madison
  }

  add(metricName: string[]): void
  add(metricName: string): void
  add(param1: string | string[]): void {
    if (typeof param1 === 'string') {
      if (!this.__metricDataMap.has(param1)) {
        this.__metricDataMap.set(param1, new MetricData(param1, this.__madison))
      }
    } else {
      param1.forEach((name) => {
        if (!this.__metricDataMap.has(name)) {
          this.__metricDataMap.set(name, new MetricData(name, this.__madison))
        }
      })
    }
  }

  set(name: string, id: string, data: MachineMetricRes): boolean {
    const ins = this.get(name)
    if (!ins) return false
    return ins.set(id, data)
  }

  get(metricName: string): MetricData | undefined
  get(metricName: string[]): MetricData[]
  get(param1: string | string[]): MetricData | MetricData[] | undefined {
    if (typeof param1 === 'string') {
      return this.__metricDataMap.get(param1)
    } else {
      return param1
        .map((name) => {
          const data = this.__metricDataMap.get(name)
          if (data === undefined) return
          return data
        })
        .filter((item) => item !== undefined)
    }
  }

  checkDataExist(metricName: string[], id: string): string[] {
    const res: string[] = []
    metricName.forEach((name) => {
      const ins = this.get(name)
      if (!ins) {
        this.add(name)
        res.push(name)
        return
      }
      if (!ins.has(id)) {
        res.push(name)
      }
    })
    return res
  }

  getData(metricName: string[], id: string) {
    return metricName
      .map((name) => {
        const ins = this.get(name)
        if (!ins) return
        return ins.get(id)
      })
      .filter((item) => item !== undefined)
  }
}

export class MetricData {
  readonly name: string
  /**
   * <startTime+endTime, >
   */
  private __dataMap: Map<string, MetricDataDetail> = new Map()
  private __madison: Madison

  constructor(name: string, madison: Madison) {
    this.name = name
    this.__madison = madison
  }

  has(id: string) {
    return this.__dataMap.has(id)
  }

  set(id: string, data: MachineMetricRes): boolean {
    this.__dataMap.set(id, new MetricDataDetail(data, id + '-' + this.name, this.__madison, this.name))
    return true
  }

  get(id: string) {
    return this.__dataMap.get(id)
  }
}

export class MetricDataDetail {
  private __data: MachineMetricRes
  readonly id: string
  private __myChart: echarts.ECharts | null = null
  private __watchHandleTheme: WatchHandle | null = null
  private __madison: Madison
  private __selectSeries: string = ''
  readonly name: string

  windowResizeFunc: any

  constructor(data: MachineMetricRes, id: string, madison: Madison, name: string) {
    this.__data = data
    this.id = id
    this.__madison = madison
    this.name = name

    this.windowResizeFunc = this.resizeChart.bind(this)
  }

  /**
   * 渲染图表
   * @param chartElement
   * @returns
   */
  render(chartElement: HTMLDivElement): boolean {
    if (this.__watchHandleTheme) this.__watchHandleTheme.stop()
    this.distory()
    const res = this.renderChart(chartElement)
    this.__watchHandleTheme = watch(this.__madison.theme.theme, (newVal) => {
      if (this.__myChart) {
        this.__myChart.dispose()
        this.__myChart = null
      }
      this.renderChart(chartElement)
    })
    return res
  }

  private renderChart(element: HTMLDivElement): boolean {
    const theme = this.__madison.theme.theme.value

    const data: echarts.SeriesOption[] = this.__data.map((item) => {
      return {
        name: item.metric.__name__ + JSON.stringify(item.metric),
        type: 'line',
        smooth: true,
        symbol: 'none',
        triggerLineEvent: true,
        data: item.values.map((d) => [new Date(d[0] * 1000), parseInt(d[1])]) as [Date, number][],
        lineStyle: {
          width: 3
        }
      }
    })
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        appendTo: document.body,
        formatter: (params: any) => {
          let res = ''
          for (let i = 0; i < params.length; i++) {
            const series = params[i]
            if (series.seriesName === this.__selectSeries) {
              res = `<div style="margin: 0px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${series.axisValueLabel}</div><div style="margin: 10px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${series.color};"></span><span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${echarts.format.truncateText(series.seriesName, 400, '14px Microsoft Yahei', '…')}</span><span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${series.value[1]}</span><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div>`
              break
            }
          }
          return res
        }
        // confine: true
      },
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      title: {
        left: 'center',
        text: this.name
      },
      grid: {
        left: 80,
        right: 80,
        bottom: 120
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value) {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(3) + 'B' // 十亿
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(3) + 'M' // 百万
            } else if (value >= 1000) {
              return (value / 1000).toFixed(3) + 'k' // 千
            } else {
              return value.toString() // 小于1000，直接显示
            }
          }
        },
        boundaryGap: [0, '10%']
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          bottom: 60,
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          show: true,
          yAxisIndex: [0],
          right: 40,
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
          preventDefaultMouseMove: false
        },
        {
          type: 'inside',
          yAxisIndex: [0],
          start: 0,
          end: 100,
          preventDefaultMouseMove: false
        }
      ],
      series: data,
      emphasis: {
        focus: 'series'
      },
      legend: {
        formatter: (name) => {
          // return echarts.format.truncateText(name, 50, '14px Microsoft Yahei', '…')
          return name
        },
        tooltip: {
          show: true
        },
        type: 'scroll',
        orient: 'vertical',
        height: 40,
        // right: 10,
        // top: 60,
        bottom: 0
      }
    }
    this.__myChart = echarts.init(element, theme === 'light' ? undefined : 'dark')
    this.__myChart.setOption(option)

    this.__myChart.on('mousemove', (params) => {
      this.__selectSeries = params.seriesName || ''
      // console.log('mousemove')
    })

    this.__myChart.on('mouseout', (params) => {
      this.__selectSeries = ''
      // console.log('mouseout')
    })
    window.addEventListener('resize', this.windowResizeFunc)
    return true
  }

  /**
   * 图表销毁
   */
  distory() {
    window.removeEventListener('resize', this.windowResizeFunc)
    if (this.__myChart) {
      this.__myChart.dispose()
      this.__myChart = null
    }
    if (this.__watchHandleTheme) {
      this.__watchHandleTheme.stop()
    }
  }

  resizeChart() {
    if (this.__myChart) {
      this.__myChart.resize()
    }
  }
}
