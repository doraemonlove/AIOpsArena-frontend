export default {
  Title: '训练记录',
  Description: '查看训练任务状态，检查运行详情，读取日志，并管理当前训练流程。',
  CreateTrain: '创建训练',
  Refresh: '刷新',
  Empty: '暂无训练记录。',
  Filter: {
    Type: '算法类型',
    Status: '状态',
    All: '全部',
    Search: '按算法或数据集搜索'
  },
  Table: {
    Id: 'ID',
    AlgorithmName: '算法名称',
    AlgorithmType: '算法类型',
    DatasetName: '数据集名称',
    OwnerName: '创建人',
    Status: '状态',
    ErrorMessage: '错误信息',
    CreatedAt: '创建时间',
    StartedAt: '开始时间',
    FinishedAt: '结束时间',
    Actions: '操作'
  },
  StatusText: {
    waiting: '等待中',
    starting: '启动中',
    running: '运行中',
    finished: '已完成',
    failed: '失败',
    canceled: '已取消'
  },
  Deleted: '已删除',
  Actions: {
    Detail: '详情',
    Rerun: '重新运行',
    Delete: '删除',
    CancelTask: '取消任务',
    Close: '关闭',
    Submit: '提交'
  },
  Create: {
    Title: '创建训练',
    AlgorithmType: '算法类型',
    AlgorithmTypePlaceholder: '请选择算法类型',
    AlgorithmTemplate: '算法模板',
    AlgorithmTemplatePlaceholder: '请选择算法模板',
    Dataset: '数据集',
    DatasetPlaceholder: '请选择数据集',
    Config: '算法参数（JSON）',
    ConfigPlaceholder: '{\n  "lr": 0.01,\n  "epochs": 10\n}',
    Mode: '模式',
    Train: 'train'
  },
  Detail: {
    Title: '训练详情',
    Empty: '暂无详情信息。',
    BasicInfo: '基本信息',
    Logs: '日志'
  },
  Log: {
    Empty: '暂无日志内容。'
  },
  Confirm: {
    DeleteTitle: '删除训练记录',
    DeleteContent: '确认删除训练记录 #{id} 吗？',
    CancelTitle: '取消训练',
    CancelContent: '确认取消训练记录 #{id} 吗？',
    Confirm: '确定',
    Cancel: '取消'
  },
  Message: {
    LoadFailed: '获取训练记录失败',
    CreateSuccess: '训练已创建',
    CreateFailed: '创建训练失败',
    DeleteSuccess: '训练记录已删除',
    DeleteFailed: '删除训练记录失败',
    CancelSuccess: '训练已取消',
    CancelFailed: '取消训练失败',
    PermissionDenied: '只有创建人可以执行该操作',
    RerunSuccess: '训练已重新创建',
    RerunFailed: '重新运行失败',
    DetailFailed: '获取训练详情失败',
    ConfigInvalid: '算法参数必须是合法 JSON',
    AlgorithmRequired: '请选择算法模板',
    DatasetRequired: '请选择数据集'
  }
}
