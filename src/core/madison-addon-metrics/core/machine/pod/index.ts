import { LoginState } from '@/core/madison-addon-login'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { Topology } from './topology'
import { getPodTopology } from '../../api'
import * as echarts from 'echarts'
import { computed, ref, type ComputedRef, type Ref, watch, type WatchHandle } from 'vue'
import type { Madison } from '@/core/madison/core'

export class Pod extends MadisonAddon {
  private __searchedNamespace: Set<string> = new Set()
  private __topologyMap: Map<string, Topology[]> = new Map()
  private __topologyEchartData: Map<string, { nodes: any[]; links: any[]; categories: any[] }> =
    new Map()
  private __selectedService: Ref<string> = ref('')
  private __renderSuccess: Ref<boolean> = ref(false)
  private __myChart: echarts.ECharts | null = null
  private __watchHandleTheme: WatchHandle | null = null
  private __watchHandleNS: WatchHandle | null = null

  windowResizeFunc: any

  get selectedService(): ComputedRef<Topology> | ComputedRef<undefined> {
    return computed(() => {
      if (this.__selectedService.value === '') return undefined
      const namespace = this.__madison.namespace.queryNamespace.value
      const service = this.__selectedService.value
      const ts = this.__topologyMap.get(namespace)
      if (ts === undefined) return undefined
      return ts.find((item) => item.name === service)
    })
  }

  get renderSuccess(): ComputedRef<boolean> {
    return computed(() => {
      return this.__renderSuccess.value
    })
  }

  constructor(madison: Madison) {
    super(madison)

    madison.routerPromise.addCheck(this.checkPodTopology, this)

    watch(madison.namespace.queryParamNamespace, (newVal) => {
      //
      // urlNamespace改变说明路由准备改变，销毁图表
      //
      if (this.__myChart) {
        this.__myChart.dispose()
        this.__myChart = null
      }
    })

    this.windowResizeFunc = this.resizeChart.bind(this)
  }

  logoutCallback(): void {
    this.distory()
  }

  async checkPodTopology(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (to.name === 'login' || to.name === 'register') return
    if (to.name !== 'metricsmachinepod') return
    //
    // 已经登录并且没有获取数据
    //
    console.log('waiting for login')
    await this.__madison.login.waitingForLogin
    if (this.__madison.login.state !== LoginState.LOGGED) return
    const namespace = this.__madison.namespace.queryQueryNamespace.value
    if (this.__searchedNamespace.has(namespace)) return
    const res = await getPodTopology({ namespace })
    const data = res.data
    this.__searchedNamespace.add(namespace)
    if (data.code === 0) {
      //
      // 创建拓扑图
      //
      const list = []
      for (const key in data.data.services) {
        list.push(new Topology(key, data.data.services[key]))
      }
      this.__topologyMap.set(namespace, list)
      this.createTopologyData(namespace)
    }
  }

  private createTopologyData(namespace: string) {
    const data = this.__topologyMap.get(namespace)
    if (data === undefined) return
    const nodes: {
      id: string
      name: string
      category: number
      value: number
      instances: string[]
    }[] = []
    const categories: { name: string }[] = []
    const links: { source: string; target: string }[] = []
    data.forEach((item, i) => {
      nodes.push({
        id: item.name,
        name: item.name,
        category: i,
        value: item.calls.length,
        instances: item.instances
      })
      categories.push({ name: item.name })
      item.calls.forEach((call) => {
        links.push({ source: item.name, target: call })
      })
    })
    this.__topologyEchartData.set(namespace, {
      nodes,
      links,
      categories
    })
  }

  render(chartElement: HTMLDivElement): boolean {
    if (this.__watchHandleTheme) this.__watchHandleTheme.stop()
    if (this.__watchHandleNS) this.__watchHandleNS.stop()
    this.distory()
    const res = this.renderChart(chartElement)
    this.__watchHandleTheme = watch(this.__madison.theme.theme, (newVal) => {
      if (this.__myChart) {
        this.__myChart.dispose()
        this.__myChart = null
      }
      this.renderChart(chartElement)
    })
    this.__watchHandleNS = watch(this.__madison.namespace.queryNamespace, (newVal) => {
      //
      // 路由跳转说明图标数据已经改变
      //
      this.__selectedService.value = ''
      //
      // 此处namespace改变代表路由已经跳转完成，销毁在urlNamespace做
      //
      this.renderChart(chartElement)
    })
    return res
  }

  distory() {
    window.removeEventListener('resize', this.windowResizeFunc)
    if (this.__myChart) {
      this.__myChart.dispose()
      this.__myChart = null
    }
    if (this.__watchHandleTheme) {
      this.__watchHandleTheme.stop()
    }
    if (this.__watchHandleNS) {
      this.__watchHandleNS.stop()
    }
  }

  resizeChart() {
    if (this.__myChart) {
      this.__myChart.resize()
    }
  }

  private renderChart(element: HTMLDivElement): boolean {
    const namespace = this.__madison.namespace.queryNamespace.value
    const theme = this.__madison.theme.theme.value
    const data = this.__topologyEchartData.get(namespace)
    if (data === undefined) {
      this.__renderSuccess.value = false
      return false
    }
    const option: echarts.EChartsOption = {
      title: {
        text: 'Services Topology',
        subtext: 'Click on the node to select an instance and view data',
        top: 'top',
        left: 'left'
      },
      tooltip: {},
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      series: [
        {
          type: 'graph',
          layout: 'force', // 使用自定义布局
          symbolSize: 50,
          roam: true,
          label: {
            show: true
          },
          force: {
            repulsion: 2000
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            fontSize: 20
          },
          data: data.nodes,
          links: data.links,
          lineStyle: {
            opacity: 0.9,
            width: 3,
            curveness: 0.3 // 增加曲率以避免重叠
          },
          draggable: true, // 允许节点拖动
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 10
            }
          },
          categories: data.categories
        }
      ]
    }
    this.__myChart = echarts.init(element, theme === 'light' ? undefined : 'dark')
    this.__myChart.setOption(option)
    this.__myChart.on('click', (params) => {
      if (params.dataType === 'node') {
        this.__selectedService.value = params.name
      }
    })
    window.addEventListener('resize', this.windowResizeFunc)
    this.__renderSuccess.value = true
    return true
  }
}
