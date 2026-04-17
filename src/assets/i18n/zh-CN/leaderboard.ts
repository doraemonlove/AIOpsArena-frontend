export default {
  Title: '评测',
  Description: '统一管理批量评测记录，按算法类型筛选，并查看每条记录下的算法明细与指标结果。',
  Empty: '暂无评测记录。',
  Filter: {
    All: '全部算法类型',
    Search: '按评测名称搜索'
  },
  Table: {
    Id: 'ID',
    Name: '名称',
    AlgorithmType: '算法类型',
    DatasetName: '数据集',
    RunCount: '运行数量',
    Status: '状态',
    Visibility: '可见性',
    OwnerName: '拥有者',
    CreatedAt: '创建时间',
    UpdatedAt: '更新时间',
    Actions: '操作'
  },
  Status: {
    running: '运行中',
    finished: '已完成',
    failed: '失败'
  },
  Visibility: {
    Public: '公开',
    Private: '私有'
  },
  Actions: {
    Create: '创建评测',
    Refresh: '刷新',
    Detail: '详情',
    Rerun: '重新运行',
    Delete: '删除',
    DeleteItem: '删除条目',
    SetPublic: '设为公开',
    SetPrivate: '设为私有',
    Close: '关闭'
  },
  Create: {
    Title: '创建评测',
    Name: '名称',
    NamePlaceholder: '请输入评测名称',
    AlgorithmType: '算法类型',
    AlgorithmTypePlaceholder: '请选择算法类型',
    Dataset: '数据集',
    DatasetPlaceholder: '请选择数据集',
    Description: '描述',
    DescriptionPlaceholder: '补充本次评测说明',
    Visibility: '可见性',
    SourceRuns: 'Source Train Runs',
    SourceRunsHint: '选择要纳入本次批量评测的训练记录。',
    SourceRunsSearch: '搜索训练记录',
    SelectedRuns: '已选择 {count} 条',
    NoSourceRuns: '当前算法类型下暂无可用训练记录。',
    SourceRunTable: {
      Id: '运行 ID',
      AlgorithmName: '算法名称',
      DatasetName: '数据集',
      Status: '状态',
      FinishedAt: '完成时间'
    }
  },
  Detail: {
    Title: '评测详情',
    Empty: '暂无详情信息。',
    BasicInfo: '基本信息',
    ResultTitle: '排行榜结果',
    ItemsTitle: '算法条目',
    ItemsCount: '{count} 条',
    NoItems: '暂无评测条目。',
    ResultTable: {
      AlgorithmName: '算法名称',
      EvaluationResult: '评测结果',
      NoMetrics: '暂无指标'
    },
    Table: {
      ItemId: '条目 ID',
      AlgorithmName: '算法名称',
      SourceRunId: '来源训练 ID',
      TestRunId: '测试运行 ID',
      ItemStatus: '条目状态',
      RunStatus: '运行状态',
      EvaluationStatus: '评测状态',
      ErrorMessage: '错误信息',
      EvaluationError: '评测错误',
      CreatedAt: '创建时间'
    }
  },
  Confirm: {
    DeleteTitle: '删除评测',
    DeleteContent: '确认删除评测 "#{id} {name}" 吗？',
    DeleteItemTitle: '删除评测条目',
    DeleteItemContent: '确认删除当前评测中的条目 "#{id} {name}" 吗？',
    RerunItemTitle: '重新运行评测条目',
    RerunItemContent: '确认重新运行当前评测中的条目 "#{id} {name}" 吗？'
  },
  Message: {
    LoadFailed: '获取评测列表失败',
    CreateSuccess: '评测已创建',
    CreateFailed: '创建评测失败',
    DeleteSuccess: '评测已删除',
    DeleteFailed: '删除评测失败',
    DeleteItemSuccess: '评测条目已删除',
    DeleteItemFailed: '删除评测条目失败',
    DetailFailed: '获取评测详情失败',
    RerunSuccess: '评测条目已重新运行',
    RerunFailed: '重新运行评测条目失败',
    ToggleVisibilitySuccess: '评测公开性已更新',
    ToggleVisibilityFailed: '切换评测公开性失败',
    RerunUnavailable: '当前条目没有可复用的测试运行',
    AvailableRunsFailed: '获取可用训练记录失败',
    NameRequired: '请输入评测名称',
    AlgorithmTypeRequired: '请选择算法类型',
    DatasetRequired: '请选择数据集',
    SourceRunsRequired: '请至少选择一条训练记录'
  }
}
