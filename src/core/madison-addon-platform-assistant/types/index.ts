export const PLATFORM_ASSISTANT_APP_NAME = 'aiopsagent'

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BASE_URL || 'http://localhost:8002'

export const AGENT_SERVER_BASE_URL =
  import.meta.env.VITE_PLATFORM_ASSISTANT_AGENT_SERVER_BASE_URL || '/agent-api'

export type ChatMessageStatus = 'streaming' | 'done' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  status?: ChatMessageStatus
}

export interface AssistantSessionApiItem {
  id: number
  session_id: string
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
