import Logs from './logs'
import Metrics from './metrics'
import Traces from './traces'
import Metric from './metric'
import Trace from './trace'

export default {
  Sidebar: {
    SelectData: 'Select Data',
    NowNamespace: 'Now Namespace',
    InputNamespace: 'Input Namespace',
    Goto: 'Goto',
    YourNamespaces: 'Your Namespaces',
    SelectType: 'Select Type',
    NowType: 'Now Type',
    YourTypes: 'Your Types',
    Logs: 'Logs',
    Metrics: 'Metrics',
    Traces: 'Traces'
  },
  QueryTaskList: {
    QueryTaskList: 'Query Task List',
    NullQueryTask: 'No query tasks',
    CreateQueryTask: 'Create Query Task',
    Status: 'Status',
    SelectATimeRange: 'Select Range:',
    SelectEndTime: 'Select End Time:',
    SelectEndTime2: 'Select End Time',
    Cancel: 'Cancel',
    Confirm: 'Confirm'
  },
  Common: {
    Error: 'Error'
  },
  Namespace: {
    SelectOrInputNamespace: 'Select or Input Namespace'
  },
  Home: {
    ViewDetails: 'View Details',
    Logs: 'Query logs data',
    Metrics: 'Query metrics data',
    Traces: 'Query traces data',
    NullNamespace: 'No namespaces found for the current user',
    Microservice: 'Microservice',
    Testbed: 'Testbed',
    Or: 'or',
    PLSGoto: 'Please goto',
    LastS: 'to create a testbed and obtain the namespace;',
    OINS: 'Or input namespace:',
    InputNamespace: 'Input Namespace',
    Goto: 'Goto'
  },
  MetricsMachine: {
    Nav: {
      Node: 'Node',
      Service: 'Service',
      Pod: 'Pod',
      TiDB: 'TiDB'
    },
    Common: {
      Pods: 'Pods',
      NoPods: 'No Pods',
      NoPodsScheduled: 'No pods scheduled',
      OpenWorkspace: 'Open workspace',
      NamespaceOrServerError: 'It could be a namespace error or a server error',
      MoreCount: '+{count} more',
      MorePodsCount: '+{count} more pods'
    },
    Inspector: {
      Clear: 'Clear',
      MetricsCount: '{count} metrics',
      AddAll: 'Add all',
      Add: 'Add',
      Remove: 'Remove'
    },
    Charts: {
      Label: 'Charts',
      Title: 'Metric Trends',
      SelectedCount: '{count} selected'
    },
    Legacy: {
      SelectMetricsHint: 'Select metrics from the left sidebar to start exploring charts'
    },
    Node: {
      Plural: 'Nodes',
      WorkspaceLabel: 'Node Workspace',
      WorkspaceDescription: 'Inspect this node\'s infrastructure metrics without letting the overview list take over the page.',
      PodsOnNode: 'Pods on Node',
      AttachedPods: 'Attached Pods',
      WorkloadsRunningHere: 'Workloads Running Here',
      PodsCount: '{count} pods',
      NoPodsOnNode: 'No pods scheduled on this node',
      MetricsTitle: 'Node Metrics',
      MetricsDescription: 'Choose the most useful infrastructure metrics for this node, then compare trends in the chart area below.',
      ChooseNodeHint: 'Choose a node card to start',
      EmptyChartMessage: 'Add one or more node metrics to render charts for this selected node.',
      DirectoryTitle: 'Node Directory',
      DirectoryDescription: 'Pick a node to open its metrics workspace. The overview stays compact so you can scan the cluster faster.',
      NodesCount: '{count} nodes',
      ComputeNode: 'Compute Node'
    },
    Service: {
      Plural: 'Services',
      WorkspaceLabel: 'Service Workspace',
      WorkspaceDescription: 'Inspect service-level request, latency, and dependency signals without keeping the topology list open.',
      AttachedPods: 'Attached Pods',
      WorkloadsBehindService: 'Workloads Behind This Service',
      PodsCount: '{count} pods',
      DownstreamCallsCount: '{count} downstream calls',
      NoPodsForService: 'No pods found for this service',
      MetricsTitle: 'Service Metrics',
      MetricsDescription: 'Select service metrics for this service.',
      ChooseServiceHint: 'Choose a service card to start',
      EmptyChartMessage: 'Add one or more service metrics to render charts for this selected service.',
      DirectoryTitle: 'Service Directory',
      DirectoryDescription: 'Click a service node in the call graph to open its metrics workspace.',
      ServicesCount: '{count} services',
      CallGraphTitle: 'Service Call Graph',
      CallGraphDescription: 'Drag to arrange, scroll to zoom, click a node to inspect metrics.',
      CallsCount: '{count} calls',
      GraphCallEdge: '{source} calls {target}'
    },
    Pod: {
      Plural: 'Pods',
      WorkspaceLabel: 'Pod Workspace',
      WorkspaceDescription: 'Inspect pod-level CPU, memory, filesystem, and network signals for this workload instance.',
      MetricsTitle: 'Pod Metrics',
      MetricsDescription: 'Select pod metrics for this workload instance.',
      ChoosePodHint: 'Choose a pod card to start',
      EmptyChartMessage: 'Add one or more pod metrics to render charts for this selected pod.',
      DirectoryTitle: 'Pod Directory',
      DirectoryDescription: 'Pick a pod from its service group to open the metrics workspace.',
      DirectoryCounts: '{services} services · {pods} pods',
      PodsCount: '{count} pods'
    },
    TiDB: {
      MetricsTitle: 'TiDB Metrics',
      MetricsDescription: 'Select TiDB recorded metrics at namespace scope.',
      EmptyHint: 'TiDB metrics are namespace scoped',
      EmptyChartMessage: 'Add one or more TiDB metrics to render charts.'
    }
  },
  Logs,
  Metrics,
  Traces,
  Metric,
  Trace
}
