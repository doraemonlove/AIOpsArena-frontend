export default {
  Title: '算法管理',
  Description: '统一管理公开和私有算法模板，跟踪导入与镜像构建状态，并按算法类型组织展示。',
  UploadAlgorithm: '上传算法',
  DownloadTemplate: '下载模板',
  Refresh: '刷新',
  PublicAlgorithms: '公开算法',
  PrivateAlgorithms: '私有算法',
  NoPublicAlgorithms: '暂无公开算法。',
  NoPrivateAlgorithms: '暂无私有算法。',
  AlgorithmsCount: '{count} 个算法',
  ItemsCount: '{count} 条',
  ItemCount: '{count} 条',
  Table: {
    AlgorithmName: '算法名称',
    AlgorithmType: '算法类型',
    Description: '描述',
    Owner: '拥有者',
    Visibility: '可见性',
    Status: '导入状态',
    ImageStatus: '镜像状态',
    CreatedAt: '创建时间',
    Operations: '操作'
  },
  Visibility: {
    Public: '公开',
    Private: '私有'
  },
  Filter: {
    Type: '类型筛选',
    All: '全部'
  },
  StatusText: {
    importing: '导入中',
    ready: '就绪',
    failed: '失败',
    building: '构建中',
    not_built: '未构建'
  },
  Actions: {
    MakePublic: '设为公开',
    MakePrivate: '设为私有',
    BuildImage: '构建镜像',
    Delete: '删除',
    Cancel: '取消'
  },
  Upload: {
    Title: '上传算法',
    AlgorithmName: '算法名称',
    AlgorithmNamePlaceholder: '请输入算法名称',
    AlgorithmType: '算法类型',
    AlgorithmTypePlaceholder: '请选择算法类型',
    DatasetType: '数据类型',
    Visibility: '可见性',
    Public: '公开',
    Private: '私有',
    File: '算法文件',
    FilePlaceholder: '拖拽文件到这里，或点击选择',
    Submit: '上传算法',
    Validation: {
      NameRequired: '请输入算法名称',
      TypeRequired: '请选择算法类型',
      DatasetTypeRequired: '请至少选择一种数据类型',
      FileRequired: '请选择算法文件'
    }
  },
  Message: {
    LoadFailed: '获取算法列表失败',
    FetchImportStatusFailed: '获取导入状态失败',
    FetchImageStatusFailed: '获取镜像构建状态失败',
    UploadStarted: '算法已开始导入',
    UploadFailed: '上传算法失败',
    BuildStarted: '镜像构建已开始',
    BuildFailed: '构建镜像失败',
    PermissionDenied: '只有创建人可以执行该操作',
    ToggleVisibilitySuccess: '公开性已更新',
    ToggleVisibilityFailed: '切换公开性失败',
    DownloadTemplateFailed: '下载模板失败',
    DeleteSuccess: '算法已删除',
    DeleteFailed: '删除算法失败'
  },
  DeleteDialog: {
    Title: '删除算法',
    Content: '确认删除算法“{name}”吗？',
    Confirm: '删除',
    Cancel: '取消'
  }
}
