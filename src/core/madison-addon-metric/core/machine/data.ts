import * as echarts from 'echarts'
import { reactive, watch, type Reactive, type Ref, type WatchHandle } from 'vue'
import type { MachineMetricRes } from '../../types'
import type { MadisonTheme } from '@/core/madison-addon-theme'
import type { MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import { LRUCache } from '@/components/LoongCalendar'

export class MetriMachineDataDetail {
  private __data: MachineMetricRes
  readonly id: string
  private __myChart: echarts.ECharts | null = null
  private __watchHandleTheme: WatchHandle | null = null
  private __madisonTheme: Ref<MadisonTheme, MadisonTheme>
  private __selectSeries: string = ''
  readonly name: string

  windowResizeFunc: any

  constructor(
    data: MachineMetricRes,
    id: string,
    madisonTheme: Ref<MadisonTheme, MadisonTheme>,
    name: string
  ) {
    this.__data = data
    this.id = id
    this.__madisonTheme = madisonTheme
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
    this.__watchHandleTheme = watch(this.__madisonTheme, (newVal) => {
      if (this.__myChart) {
        this.__myChart.dispose()
        this.__myChart = null
      }
      this.renderChart(chartElement)
    })
    return res
  }

  private renderChart(element: HTMLDivElement): boolean {
    const theme = this.__madisonTheme.value

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
          formatter: function (value) {
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

export class MetricMachineDatabase {
  /** namespace/type/detail node or pod/metricName/startTime/endTime */
  private __data: Reactive<LRUCache<string, MadisonAddonDataQueryTask<MetriMachineDataDetail>>> =
    reactive(
      new LRUCache(200, (k, v) => {
        this.deleteCallback(k, v)
      })
    )

  private __deleteCallback: (
    k: string,
    v: MadisonAddonDataQueryTask<MetriMachineDataDetail>
  ) => void

  constructor(
    deleteCallback: (key: string, value: MadisonAddonDataQueryTask<MetriMachineDataDetail>) => void
  ) {
    this.__deleteCallback = deleteCallback
  }

  private deleteCallback(key: string, value: MadisonAddonDataQueryTask<MetriMachineDataDetail>) {
    this.__deleteCallback(key, value)
    value.data?.distory()
  }

  has(key: string): boolean {
    return this.__data.has(key)
  }

  get(key: string): MadisonAddonDataQueryTask<MetriMachineDataDetail> | undefined {
    return this.__data.get(key)
  }

  set(key: string, value: MadisonAddonDataQueryTask<MetriMachineDataDetail>) {
    return this.__data.set(key, value)
  }

  clear() {
    const keys = Array.from(this.__data.keys())
    keys.forEach(key => this.__data.delete(key))
  }
}
