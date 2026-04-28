import { getToken, service, message } from '@/core/madison/utils'
import type { MadisonApiRes } from '@/core/madison/types'
import {
  AGENT_SERVER_BASE_URL,
  BACKEND_BASE_URL,
  PLATFORM_ASSISTANT_APP_NAME
} from '../types'
import type {
  AssistantSession,
  AssistantSessionDetail,
  AssistantSessionApiItem,
  CreateAssistantSessionPayload,
  DeleteAssistantSessionPayload,
  GetAssistantSessionPayload,
  ListAssistantSessionsPayload,
  RunAssistantSSEPayload
} from '../types'

export function normalizeAssistantSession(item: AssistantSessionApiItem): AssistantSession {
  return {
    id: item.id,
    sessionId: item.session_id,
    appName: item.app_name,
    title: item.title || '新会话',
    state: item.state,
    lastUpdateTime: item.last_update_time,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    messages: []
  }
}

export async function createAssistantSession(options: CreateAssistantSessionPayload = {}) {
  return service<AssistantSessionApiItem>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/create',
    method: 'post',
    data: {
      app_name: options.app_name || PLATFORM_ASSISTANT_APP_NAME,
      ...(options.title ? { title: options.title } : {})
    }
  })
}

export async function listAssistantSessions(options: ListAssistantSessionsPayload = {}) {
  return service<AssistantSessionApiItem[]>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/list',
    method: 'get',
    params: {
      app_name: options.app_name || PLATFORM_ASSISTANT_APP_NAME
    }
  })
}

export async function deleteAssistantSession(payload: DeleteAssistantSessionPayload) {
  const response = await service<null>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/delete',
    method: 'post',
    data: {
      id: payload.id
    }
  })

  const data = response.data
  if (!data || data.code !== 0) {
    throw new Error(data?.message || '删除会话失败')
  }
}

export async function getAssistantSession(payload: GetAssistantSessionPayload) {
  const response = await fetch(
    `${AGENT_SERVER_BASE_URL}/apps/${encodeURIComponent(payload.app_name || PLATFORM_ASSISTANT_APP_NAME)}/users/${encodeURIComponent(payload.user_id)}/sessions/${encodeURIComponent(payload.session_id)}`,
    {
      method: 'GET',
      headers: buildAssistantHeaders()
    }
  )

  if (!response.ok) {
    let errorMsg = `查询会话消息失败（${response.status}）`
    try {
      const data = (await response.json()) as MadisonApiRes<any>
      errorMsg = data?.message || errorMsg
    } catch (_) {
      try {
        errorMsg = (await response.text()) || errorMsg
      } catch (_) {}
    }
    throw new Error(errorMsg)
  }

  return (await response.json()) as AssistantSessionDetail
}

function buildAssistantHeaders() {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = 'token ' + token
  }
  return headers
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return '平台助手请求失败'
}

export async function runAssistantSSE(
  payload: RunAssistantSSEPayload,
  handlers: {
    onText: (text: string) => void
    onFinish?: () => void
    onError?: (error: Error) => void
  }
) {
  const response = await fetch(`${AGENT_SERVER_BASE_URL}/run_sse`, {
    method: 'POST',
    headers: buildAssistantHeaders(),
    body: JSON.stringify({
      ...payload,
      app_name: payload.app_name || PLATFORM_ASSISTANT_APP_NAME
    })
  })

  if (!response.ok || !response.body) {
    let errorMsg = `平台助手响应失败（${response.status}）`
    try {
      const data = (await response.json()) as MadisonApiRes<any>
      errorMsg = data?.message || errorMsg
    } catch (_) {}
    throw new Error(errorMsg)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')

      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex !== -1) {
        const rawEvent = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)
        consumeSSEEvent(rawEvent, handlers.onText)
        boundaryIndex = buffer.indexOf('\n\n')
      }

      if (done) {
        if (buffer.trim()) {
          consumeSSEEvent(buffer, handlers.onText)
        }
        handlers.onFinish?.()
        break
      }
    }
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(getErrorMessage(error))
    handlers.onError?.(normalized)
    throw normalized
  } finally {
    reader.releaseLock()
  }
}

function consumeSSEEvent(rawEvent: string, onText: (text: string) => void) {
  const dataLines = rawEvent
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  if (!dataLines.length) return

  const dataText = dataLines.join('\n')
  if (!dataText || dataText === '[DONE]') return

  try {
    const payload = JSON.parse(dataText)
    const text = extractDisplayText(payload)
    if (text) {
      onText(text)
    }
  } catch (_) {
    // Ignore protocol fragments that are not valid JSON payloads.
  }
}

function extractDisplayText(payload: unknown) {
  const texts: string[] = []
  const visited = new WeakSet<object>()
  const ignoredKeys = new Set([
    'functionCall',
    'functionResponse',
    'thought',
    'tool',
    'tools',
    'debug',
    'raw'
  ])

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (visited.has(value as object)) return
    visited.add(value as object)

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    for (const [key, child] of Object.entries(value)) {
      if (ignoredKeys.has(key)) continue

      if (
        key === 'content' &&
        child &&
        typeof child === 'object' &&
        Array.isArray((child as Record<string, unknown>).parts)
      ) {
        for (const part of (child as Record<string, unknown>).parts as Array<Record<string, unknown>>) {
          if (part && typeof part.text === 'string') {
            texts.push(part.text)
          }
        }
        continue
      }

      visit(child)
    }
  }

  visit(payload)
  return texts.join('')
}

export function showAssistantRequestError(prefix: string, error: unknown) {
  const errorMsg = getErrorMessage(error)
  message(`${prefix}: ${errorMsg}`)
}

// Placeholder for future "get messages by session" API integration.
