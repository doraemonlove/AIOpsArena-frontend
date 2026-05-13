export default {
  Sidebar: {
    Title: '平台助手',
    Subtitle: '会话管理与问答入口',
    EmptySessions: '暂无会话，先创建一个吧。'
  },
  Actions: {
    NewSession: '新建会话',
    Delete: '删除',
    Cancel: '取消',
    CancelRun: '取消实验',
    DeleteRun: '删除实验',
    AnalyzeResult: '分析结果',
    AnalyzeFailure: '分析失败原因',
    GoLogin: '去登录',
    Send: '发送'
  },
  Auth: {
    LoginTitle: '登录后使用平台助手',
    LoginDescription: '查看历史会话、创建新会话和发起对话都需要先登录。',
    ViewSessions: '登录后可查看平台助手会话',
    CreateSession: '登录后可创建助手会话',
    Chat: '登录后可发起平台助手对话'
  },
  Session: {
    NewTitle: '新会话',
    DeleteTitle: '删除会话',
    DeleteConfirm: '确认删除会话“{title}”吗？',
    Deleted: '会话已删除',
    LocalCached: '本地缓存会话',
    TodayAt: '今天 {time}',
    Month: '月',
    Day: '日'
  },
  Chat: {
    NoSessionSelected: '未选择会话',
    LoginPlaceholder: '登录后即可查看会话历史并和平台助手对话。',
    SelectSessionPlaceholder: '请选择会话，或发送首条消息自动创建会话。',
    LoadingHistory: '正在加载历史消息...',
    EmptyMessages: '这里会展示当前会话的消息记录。',
    InputPlaceholder: '输入问题，Enter 发送，Shift + Enter 换行',
    TipNeedLogin: '登录后可查看会话并发起对话',
    TipReady: '已同步当前登录身份，可直接发送消息',
    TipMissingIdentity: '当前登录信息不完整，请重新登录后重试'
  },
  RunPanel: {
    Title: '会话实验',
    Subtitle: '当前会话下的实验任务',
    NoSession: '请先创建或选择会话',
    Loading: '正在加载当前会话的实验...',
    Empty: '当前会话下还没有实验任务。',
    Mode: '模式',
    Dataset: '数据集',
    EvaluationStatus: '评估状态',
    CreatedAt: '创建时间',
    FinishedAt: '结束时间',
    CancelTitle: '取消实验',
    CancelConfirm: '确认提交 run_id={runId} 的取消请求吗？',
    CancelSubmitted: '已提交取消请求',
    DeleteTitle: '删除实验',
    DeleteConfirm: '确认删除 run_id={runId} 的实验吗？',
    DeleteSuccess: '实验已删除'
  },
  RunMessage: {
    Finished: '实验 run_id={runId} 已完成。你可以点击“分析结果”让助手继续解读。',
    Failed: '实验 run_id={runId} 运行失败。你可以点击“分析失败原因”查看详情。',
    Canceled: '实验 run_id={runId} 已取消。',
    AnalyzeResultPrompt: '请分析当前会话中 run_id={runId} 的实验结果，并给出关键结论。',
    AnalyzeFailurePrompt: '请分析当前会话中 run_id={runId} 的失败原因，并给出排查建议。'
  },
  Message: {
    Streaming: '回复中...',
    Error: '回复异常'
  },
  MessageKind: {
    Thought: '思考',
    ToolCall: '工具调用',
    ToolResponse: '工具返回',
    Assistant: '助手',
    System: '系统'
  },
  Errors: {
    ListSessions: '查询会话列表失败',
    CreateSession: '新建会话失败',
    DeleteSession: '删除会话失败',
    CancelRun: '取消实验失败',
    DeleteRun: '删除实验失败',
    LoadHistory: '查询历史消息失败',
    ChatFailed: '助手对话失败',
    MissingUserId: '当前登录信息缺少用户标识，请重新登录后重试。',
    MissingUserIdSend: '当前用户缺少 user_id，无法发送助手消息',
    UnavailableSession: '未能创建可用会话，无法发送消息',
    EmptyReply: '暂未收到助手回复，请稍后重试。',
    LoginExpired: '登录状态已失效，请重新登录后重试。',
    ReplyInterrupted: '助手回复中断，请稍后重试。'
  }
}
