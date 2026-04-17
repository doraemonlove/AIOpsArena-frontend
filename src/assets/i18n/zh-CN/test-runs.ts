export default {
  Title: '推理记录',
  Description: '查看推理任务状态，检查运行详情，读取日志，并管理测试流程。',
  CreateTest: '创建推理',
  Refresh: '刷新',
  Empty: '暂无推理记录。',
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
    SourceRunId: '来源训练',
    DatasetName: '数据集名称',
    OwnerName: '创建人',
    Status: '状态',
    EvaluationStatus: '评估状态',
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
  EvaluationStatus: {
    pending: '待评估',
    success: '成功',
    failed: '失败',
    skipped: '跳过'
  },
  Deleted: '已删除',
  Actions: {
    Detail: '详情',
    Rerun: '重新推理',
    Delete: '删除',
    CancelTask: '取消任务',
    Close: '关闭'
  },
  Create: {
    Title: '创建推理',
    AlgorithmType: '算法类型',
    AlgorithmTypePlaceholder: '请选择算法类型',
    SourceRun: '来源训练记录',
    SourceRunPlaceholder: '请选择已完成训练',
    Dataset: '数据集',
    DatasetPlaceholder: '请选择数据集',
    Config: '算法参数（JSON）',
    Mode: '模式',
    Test: 'test'
  },
  Detail: {
    Title: '推理详情',
    Empty: '暂无详情信息。',
    BasicInfo: '基本信息',
    Logs: '日志'
  },
  Log: {
    Empty: '暂无日志内容。'
  },
  Confirm: {
    DeleteTitle: '删除推理记录',
    DeleteContent: '确认删除推理记录 #{id} 吗？',
    CancelTitle: '取消推理',
    CancelContent: '确认取消推理记录 #{id} 吗？',
    Confirm: '确定',
    Cancel: '取消'
  },
  Message: {
    LoadFailed: '获取推理记录失败',
    CreateSuccess: '推理已创建',
    CreateFailed: '创建推理失败',
    DeleteSuccess: '推理记录已删除',
    DeleteFailed: '删除推理记录失败',
    CancelSuccess: '推理任务已取消',
    CancelFailed: '取消推理失败',
    PermissionDenied: '只有创建人可以执行该操作',
    RerunSuccess: '重新推理已创建',
    RerunFailed: '重新推理失败',
    DetailFailed: '获取推理详情失败',
    LogFailed: '获取推理日志失败',
    ConfigInvalid: '算法参数必须是合法 JSON',
    SourceRunRequired: '请选择来源训练记录',
    DatasetRequired: '请选择数据集'
  }
}
