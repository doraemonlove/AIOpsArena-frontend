import Logs from './logs'
import Metrics from './metrics'
import Traces from './traces'
import Metric from './metric'
import Trace from './trace'

export default {
  Sidebar: {
    SelectData: '选择数据',
    NowNamespace: '当前Namespace',
    InputNamespace: '输入Namespace',
    Goto: '切换',
    YourNamespaces: '你的Namespaces',
    SelectType: '选择类型',
    NowType: '当前类型',
    YourTypes: '你的类型',
    Logs: '日志（Logs）',
    Metrics: '指标（Metrics）',
    Traces: '调用链（Traces）'
  },
  QueryTaskList: {
    QueryTaskList: '查询任务列表',
    NullQueryTask: '当前无查询任务',
    CreateQueryTask: '创建查询任务',
    Status: '状态',
    SelectATimeRange: '选择时间范围:',
    SelectEndTime: '选择结束时刻:',
    SelectEndTime2: '选择结束时刻',
    Cancel: '取消',
    Confirm: '确定'
  },
  Common: {
    Error: '错误'
  },
  Namespace: {
    SelectOrInputNamespace: '选择或输入 Namespace'
  },
  Home: {
    ViewDetails: '查看详情',
    Logs: '查询日志数据',
    Metrics: '查询指标数据',
    Traces: '查询调用链数据',
    NullNamespace: '当前用户下无Namespace',
    Microservice: '微服务',
    Testbed: '试验台',
    Or: '或',
    PLSGoto: '请前往',
    LastS: '创建试验台以获取Namespace；',
    OINS: '或输入Namespace：',
    InputNamespace: '输入Namespace',
    Goto: '切换'
  },
  MetricsMachine: {
    Nav: {
      Node: '节点',
      Service: '服务',
      Pod: 'Pod',
      TiDB: 'TiDB'
    },
    Common: {
      Pods: 'Pods',
      NoPods: '无 Pods',
      NoPodsScheduled: '当前没有调度到任何 Pods',
      OpenWorkspace: '打开工作台',
      NamespaceOrServerError: '可能是 Namespace 有误，或服务端返回异常',
      MoreCount: '+{count} 个更多项',
      MorePodsCount: '还有 {count} 个 Pods'
    },
    Inspector: {
      Clear: '清空',
      MetricsCount: '{count} 个指标',
      AddAll: '全部添加',
      Add: '添加',
      Remove: '移除'
    },
    Charts: {
      Label: '图表',
      Title: '指标趋势',
      SelectedCount: '已选择 {count} 项'
    },
    Legacy: {
      SelectMetricsHint: '从左侧选择指标后，即可开始查看图表'
    },
    Node: {
      Plural: '节点',
      WorkspaceLabel: '节点工作台',
      WorkspaceDescription: '查看这个节点的基础设施指标，同时保持概览列表不打断当前分析。',
      PodsOnNode: '节点上的 Pods',
      AttachedPods: '关联 Pods',
      WorkloadsRunningHere: '运行在此节点上的工作负载',
      PodsCount: '{count} 个 Pods',
      NoPodsOnNode: '这个节点上没有调度任何 Pods',
      MetricsTitle: '节点指标',
      MetricsDescription: '为该节点选择最关键的基础设施指标，并在下方图表区域对比变化趋势。',
      ChooseNodeHint: '先选择一个节点卡片',
      EmptyChartMessage: '添加一个或多个节点指标后，即可为当前节点绘制图表。',
      DirectoryTitle: '节点目录',
      DirectoryDescription: '选择一个节点打开它的指标工作台，概览会保持紧凑，方便更快扫描集群。',
      NodesCount: '{count} 个节点',
      ComputeNode: '计算节点'
    },
    Service: {
      Plural: '服务',
      WorkspaceLabel: '服务工作台',
      WorkspaceDescription: '查看服务级请求、延迟与依赖信号，无需一直保留拓扑列表。',
      AttachedPods: '关联 Pods',
      WorkloadsBehindService: '该服务后的工作负载',
      PodsCount: '{count} 个 Pods',
      DownstreamCallsCount: '{count} 个下游调用',
      NoPodsForService: '这个服务下没有找到 Pods',
      MetricsTitle: '服务指标',
      MetricsDescription: '为当前服务选择指标。',
      ChooseServiceHint: '先选择一个服务卡片',
      EmptyChartMessage: '添加一个或多个服务指标后，即可为当前服务绘制图表。',
      DirectoryTitle: '服务目录',
      DirectoryDescription: '点击调用图中的服务节点，即可打开对应指标工作台。',
      ServicesCount: '{count} 个服务',
      CallGraphTitle: '服务调用图',
      CallGraphDescription: '拖拽调整布局、滚轮缩放、点击节点查看指标。',
      CallsCount: '{count} 条调用',
      GraphCallEdge: '{source} 调用 {target}'
    },
    Pod: {
      Plural: 'Pods',
      WorkspaceLabel: 'Pod 工作台',
      WorkspaceDescription: '查看当前工作负载实例的 CPU、内存、文件系统和网络指标。',
      MetricsTitle: 'Pod 指标',
      MetricsDescription: '为当前工作负载实例选择 Pod 指标。',
      ChoosePodHint: '先选择一个 Pod 卡片',
      EmptyChartMessage: '添加一个或多个 Pod 指标后，即可为当前 Pod 绘制图表。',
      DirectoryTitle: 'Pod 目录',
      DirectoryDescription: '从服务分组里选择一个 Pod，打开它的指标工作台。',
      DirectoryCounts: '{services} 个服务 · {pods} 个 Pods',
      PodsCount: '{count} 个 Pods'
    },
    TiDB: {
      MetricsTitle: 'TiDB 指标',
      MetricsDescription: '选择 Namespace 维度下记录的 TiDB 指标。',
      EmptyHint: 'TiDB 指标按 Namespace 维度展示',
      EmptyChartMessage: '添加一个或多个 TiDB 指标后，即可绘制图表。'
    }
  },
  Logs,
  Metrics,
  Traces,
  Metric,
  Trace
}
