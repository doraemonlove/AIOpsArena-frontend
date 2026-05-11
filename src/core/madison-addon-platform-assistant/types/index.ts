export const PLATFORM_ASSISTANT_APP_NAME = 'aiopsagent'

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:8002'

export const AGENT_SERVER_BASE_URL =
  import.meta.env.VITE_PLATFORM_ASSISTANT_AGENT_SERVER_BASE_URL || '/agent-api'

export type ChatMessageStatus = 'streaming' | 'done' | 'error'
export type ChatMessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  createdAt: number
  status?: ChatMessageStatus
  meta?: Record<string, any>
}

export interface AssistantSessionApiItem {
  id: number | string
  session_id: string
  session_record_id?: number | string
  db_id?: number | string
  pk?: number | string
  app_name: string
  title: string
  state?: Record<string, any>
  last_update_time?: number
  is_archived?: boolean
  last_message_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface AssistantSession {
  id: number
  sessionId: string
  appName: string
  title: string
  state?: Record<string, any>
  lastUpdateTime?: number
  createdAt?: string
  updatedAt?: string
  messages: ChatMessage[]
}

export interface AssistantSessionEvent {
  id?: string
  role?: string
  author?: string
  timestamp?: number | string
  created_at?: string
  updated_at?: string
  content?: {
    role?: string
    parts?: Array<Record<string, unknown>>
  }
  [key: string]: unknown
}

export interface AssistantSessionDetail {
  id: string
  appName: string
  userId: string
  state?: Record<string, any>
  events: AssistantSessionEvent[]
}

export interface CreateAssistantSessionPayload {
  app_name?: string
  title?: string
}

export interface ListAssistantSessionsPayload {
  app_name?: string
}

export interface AssistantMessagePart {
  text: string
}

export type AssistantStreamPartKind = 'answer' | 'thought' | 'tool-call' | 'tool-response'

export interface AssistantStreamPart {
  kind: AssistantStreamPartKind
  content: string
}

export interface RunAssistantSSEPayload {
  app_name?: string
  user_id: string
  session_id: string
  new_message: {
    role: 'user'
    parts: AssistantMessagePart[]
  }
}

export interface DeleteAssistantSessionPayload {
  id: number
}

export interface GetAssistantSessionPayload {
  app_name?: string
  user_id: string
  session_id: string
}

export interface SessionRun {
  id: number
  session_id: number | string
  run_id: number
  template_id?: number
  algorithm_name?: string
  dataset_id?: number
  dataset_name?: string
  mode: 'train' | 'test' | string
  status: string
  evaluation_status: string
  title?: string
  created_at?: string
  updated_at?: string
  started_at?: string | null
  finished_at?: string | null
  is_deleted?: boolean
}

export interface CreateSessionRunPayload {
  id: number | string
  templateId: number
  mode: 'train' | 'test'
  datasetId: number
  algorithm?: Record<string, any>
  sourceRunId?: number
  title?: string
}

export interface ListSessionRunsPayload {
  id: number | string
}

export interface CancelSessionRunPayload {
  id: number | string
  runId: number
}

export interface DeleteSessionRunPayload {
  id: number | string
  runId: number
}
