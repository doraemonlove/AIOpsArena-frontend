import * as echarts from 'echarts'
import { markRaw, reactive, type Reactive } from 'vue'
import type { MadisonTheme } from '@/core/madison-addon-theme'
import type { MadisonAddonDataQueryTask } from '@/core/madison/core/addon-base'
import { LRUCache } from '@/core/madison/utils'
import type { MachineMetricRes, MachineMetricResItem } from '../../types'

type MetricPoint = [number, number]
type LegendItem = { name: string; color: string; selected: boolean }
type TooltipParam = {
  seriesName?: string
  marker?: unknown
  value?: unknown
  data?: unknown
}

const SERIES_COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc'
]

function formatMetricName(metric: Record<string, string>, fallbackName: string) {
  const metricName = metric.__name__ || fallbackName
  const labels = Object.entries(metric)
    .filter(([key]) => key !== '__name__')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}="${value}"`)

  return labels.length > 0 ? `${metricName}{${labels.join(', ')}}` : metricName
}

function normalizeSeriesData(item: MachineMetricResItem): MetricPoint[] {
  return item.values.reduce<MetricPoint[]>((result, [timestamp, rawValue]) => {
    const numericValue = Number(rawValue)
    if (!Number.isFinite(timestamp) || !Number.isFinite(numericValue)) {
      return result
    }
    result.push([timestamp * 1000, numericValue])
    return result
  }, [])
}

function formatAxisValue(value: number) {
  const absValue = Math.abs(value)
  if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (absValue >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  if (absValue >= 1) return `${value.toFixed(2)}`
  if (absValue === 0) return '0'
  return value.toPrecision(3)
}

export class MetriMachineDataDetail {
  private readonly __data: MachineMetricRes
  private readonly __queryStartTimeMs: number
  private readonly __queryEndTimeMs: number
  private __myChart: echarts.ECharts | null = null
  private __chartElement: HTMLDivElement | null = null
  private __madisonTheme: MadisonTheme
  private readonly __defaultZoomWindow = { start: 0, end: 100 }
  private __lastPointerY = 0

  readonly id: string
  readonly name: string
  readonly empty: boolean
  readonly legendItems: LegendItem[]
  readonly themeChange = this.__themeChange.bind(this)

  windowResizeFunc: () => void

  constructor(
    data: MachineMetricRes,
    id: string,
    madisonTheme: MadisonTheme,
    name: string,
    queryStartTimeMs: number,
    queryEndTimeMs: number
  ) {
    this.__data = data
    this.__queryStartTimeMs = queryStartTimeMs
    this.__queryEndTimeMs = queryEndTimeMs
    this.__madisonTheme = madisonTheme
    this.id = id
    this.name = name
    this.empty = data.length === 0 || data.every((item) => normalizeSeriesData(item).length === 0)
    this.legendItems = data
      .map((item, index) => ({
        name: formatMetricName(item.metric, this.name),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        selected: true
      }))
      .filter((item, index) => normalizeSeriesData(data[index]).length > 0)
    this.windowResizeFunc = this.resizeChart.bind(this)
  }

  private __themeChange(theme: MadisonTheme) {
    this.__madisonTheme = theme
    if (this.__chartElement) {
      this.render(this.__chartElement)
    }
  }

  render(chartElement: HTMLDivElement): boolean {
    this.distory()
    this.__chartElement = chartElement
    if (this.empty) return false

    const series = this.__data.reduce<echarts.LineSeriesOption[]>((result, item, index) => {
        const points = normalizeSeriesData(item)
        if (points.length === 0) return result
        result.push({
          name: formatMetricName(item.metric, this.name),
          type: 'line',
          showSymbol: false,
          symbolSize: 8,
          smooth: false,
          connectNulls: false,
          sampling: 'lttb',
          triggerLineEvent: true,
          lineStyle: {
            width: 2,
            color: SERIES_COLORS[index % SERIES_COLORS.length]
          },
          itemStyle: {
            color: SERIES_COLORS[index % SERIES_COLORS.length]
          },
          emphasis: {
            focus: 'series'
          },
          data: points
        })
        return result
      }, [])

    if (series.length === 0) return false

    this.__myChart = markRaw(
      echarts.init(chartElement, this.__madisonTheme === 'light' ? undefined : 'dark')
    )

    const option: echarts.EChartsOption = {
      animationDuration: 300,
      animationDurationUpdate: 300,
      backgroundColor: 'transparent',
      title: {
        show: false
      },
      grid: {
        top: 24,
        left: 72,
        right: 48,
        bottom: 56
      },
      tooltip: {
        trigger: 'axis',
        triggerOn: 'mousemove|click',
        appendTo: document.body,
        confine: true,
        formatter: (params) => {
          const nearestParam = this.getNearestTooltipParam(
            Array.isArray(params) ? params : [params]
          )
          if (!nearestParam) return ''
          return this.formatTooltip(nearestParam)
        },
        axisPointer: {
          type: 'cross',
          snap: false
        }
      },
      legend: {
        show: false,
        data: this.legendItems.map((item) => item.name),
        selected: Object.fromEntries(this.legendItems.map((item) => [item.name, item.selected]))
      },
      xAxis: {
        type: 'time',
        min: this.__queryStartTimeMs,
        max: this.__queryEndTimeMs,
        boundaryGap: ['0%', '0%'],
        axisLabel: {
          hideOverlap: true
        }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          formatter: (value: number) => formatAxisValue(value)
        }
      },
      dataZoom: [
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          bottom: 20,
          height: 24,
          start: this.__defaultZoomWindow.start,
          end: this.__defaultZoomWindow.end
        }
      ],
      series
    }

    this.__myChart.setOption(option)
    this.__myChart.getZr().on('mousemove', (event) => {
      this.__lastPointerY = event.offsetY
    })
    this.__myChart.resize()
    window.addEventListener('resize', this.windowResizeFunc)
    return true
  }

  distory() {
    window.removeEventListener('resize', this.windowResizeFunc)
    if (this.__myChart) {
      this.__myChart.dispose()
      this.__myChart = null
    }
    this.__chartElement = null
  }

  resizeChart() {
    this.__myChart?.resize()
  }

  private getNearestTooltipParam(params: TooltipParam[]) {
    const candidates = params.filter((param) => {
      const legend = this.legendItems.find((legendItem) => legendItem.name === param.seriesName)
      return legend?.selected !== false && this.getTooltipPoint(param) !== null
    })
    if (!this.__myChart || candidates.length === 0) return null

    return candidates.reduce<TooltipParam | null>((nearest, current) => {
      if (!nearest) return current
      return this.getDistanceToPointer(current) < this.getDistanceToPointer(nearest)
        ? current
        : nearest
    }, null)
  }

  private getTooltipPoint(param: TooltipParam): MetricPoint | null {
    const source = Array.isArray(param.value) ? param.value : param.data
    if (!Array.isArray(source)) return null
    const timestamp = source[0]
    const value = source[1]
    return typeof timestamp === 'number' && typeof value === 'number'
      ? [timestamp, value]
      : null
  }

  private getDistanceToPointer(param: TooltipParam) {
    const point = this.getTooltipPoint(param)
    if (!point || !this.__myChart) return Number.POSITIVE_INFINITY
    const pixel = this.__myChart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, point)
    const pixelY = Array.isArray(pixel) ? pixel[1] : Number.POSITIVE_INFINITY
    return Math.abs(pixelY - this.__lastPointerY)
  }

  private formatTooltip(param: TooltipParam) {
    const point = this.getTooltipPoint(param)
    if (!point) return ''
    const [timestamp, value] = point
    const timeLabel = echarts.time.format(timestamp, '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}', false)

    return [
      timeLabel,
      `${typeof param.marker === 'string' ? param.marker : ''}${param.seriesName || this.name}`,
      `value: ${formatAxisValue(value)}`
    ].join('<br/>')
  }

  toggleSeries(seriesName: string) {
    const item = this.legendItems.find((legendItem) => legendItem.name === seriesName)
    if (!item) return
    item.selected = !item.selected
    this.__myChart?.setOption({
      legend: {
        selected: {
          [seriesName]: item.selected
        }
      }
    })
    this.__myChart?.dispatchAction({
      type: item.selected ? 'legendSelect' : 'legendUnSelect',
      name: seriesName
    })
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
    keys.forEach((key) => this.__data.delete(key))
  }
}
