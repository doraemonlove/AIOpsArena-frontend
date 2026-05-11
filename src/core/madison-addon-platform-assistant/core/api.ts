import { getToken, service, message } from '@/core/madison/utils'
import type { MadisonApiRes } from '@/core/madison/types'
import {
  AGENT_SERVER_BASE_URL,
  BACKEND_BASE_URL,
  PLATFORM_ASSISTANT_APP_NAME
} from '../types'
import type {
  AssistantStreamPart,
  AssistantSession,
  AssistantSessionDetail,
  AssistantSessionApiItem,
  CancelSessionRunPayload,
  CreateAssistantSessionPayload,
  CreateSessionRunPayload,
  DeleteAssistantSessionPayload,
  DeleteSessionRunPayload,
  GetAssistantSessionPayload,
  ListSessionRunsPayload,
  ListAssistantSessionsPayload,
  RunAssistantSSEPayload,
  SessionRun
} from '../types'

function normalizeSessionRecordId(
  item: AssistantSessionApiItem,
  fallbackId?: number
) {
  const candidates = [item.id, item.session_record_id, item.db_id, item.pk, fallbackId]

  for (const candidate of candidates) {
    const normalized = Number(candidate)
    if (Number.isInteger(normalized) && normalized > 0) {
      return normalized
    }
  }

  return 0
}

export function normalizeAssistantSession(
  item: AssistantSessionApiItem,
  fallbackId?: number
): AssistantSession {
  return {
    id: normalizeSessionRecordId(item, fallbackId),
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

function unwrapAssistantResponse<T>(response: { data?: MadisonApiRes<T> }, fallback: string) {
  const data = response.data
  if (!data || data.code !== 0) {
    throw new Error(data?.message || fallback)
  }
  return data.data as T
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

  unwrapAssistantResponse(response, '删除会话失败')
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
    onParts?: (parts: AssistantStreamPart[]) => void
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
        consumeSSEEvent(rawEvent, handlers)
        boundaryIndex = buffer.indexOf('\n\n')
      }

      if (done) {
        if (buffer.trim()) {
          consumeSSEEvent(buffer, handlers)
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

function consumeSSEEvent(
  rawEvent: string,
  handlers: {
    onText: (text: string) => void
    onParts?: (parts: AssistantStreamPart[]) => void
  }
) {
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
    const parts = extractStreamParts(payload)
    if (parts.length) {
      handlers.onParts?.(parts)
      return
    }

    const text = extractFallbackDisplayText(payload)
    if (text) {
      handlers.onText(text)
    }
  } catch (_) {
    // Ignore protocol fragments that are not valid JSON payloads.
  }
}

export function extractStreamParts(payload: unknown): AssistantStreamPart[] {
  const parts: AssistantStreamPart[] = []
  const visited = new WeakSet<object>()

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (visited.has(value as object)) return
    visited.add(value as object)

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    const record = value as Record<string, unknown>
    const content = record.content
    if (
      content &&
      typeof content === 'object' &&
      Array.isArray((content as Record<string, unknown>).parts)
    ) {
      for (const part of (content as Record<string, unknown>).parts as Array<Record<string, unknown>>) {
        if (!part || typeof part !== 'object') continue

        if (typeof part.text === 'string' && part.text) {
          parts.push({
            kind: part.thought === true ? 'thought' : 'answer',
            content: part.text
          })
        }

        if (part.functionCall && typeof part.functionCall === 'object') {
          const functionCall = part.functionCall as Record<string, unknown>
          const name = typeof functionCall.name === 'string' ? functionCall.name : 'unknown_tool'
          const args = formatJsonBlock(functionCall.args)
          parts.push({
            kind: 'tool-call',
            content: args ? `工具调用: ${name}\n${args}` : `工具调用: ${name}`
          })
        }

        if (part.functionResponse && typeof part.functionResponse === 'object') {
          const functionResponse = part.functionResponse as Record<string, unknown>
          const name = typeof functionResponse.name === 'string' ? functionResponse.name : 'unknown_tool'
          const response = formatJsonBlock(functionResponse.response)
          parts.push({
            kind: 'tool-response',
            content: response ? `工具返回: ${name}\n${response}` : `工具返回: ${name}`
          })
        }
      }
      return
    }

    Object.values(record).forEach(visit)
  }

  visit(payload)
  return parts
}

function extractFallbackDisplayText(payload: unknown) {
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

function formatJsonBlock(value: unknown) {
  if (value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch (_) {
    return String(value)
  }
}

export function showAssistantRequestError(prefix: string, error: unknown) {
  const errorMsg = getErrorMessage(error)
  message(`${prefix}: ${errorMsg}`)
}

export function normalizeSessionRun(item: Record<string, any>): SessionRun {
  return {
    id: Number(item.id ?? 0),
    session_id: item.session_id ?? '',
    run_id: Number(item.run_id ?? item.id ?? 0),
    template_id: item.template_id !== undefined && item.template_id !== null ? Number(item.template_id) : undefined,
    algorithm_name: item.algorithm_name ?? '',
    dataset_id: item.dataset_id !== undefined && item.dataset_id !== null ? Number(item.dataset_id) : undefined,
    dataset_name: item.dataset_name ?? '',
    mode: item.mode ?? 'train',
    status: item.status ?? 'waiting',
    evaluation_status: item.evaluation_status ?? '',
    title: item.title ?? '',
    created_at: item.created_at ?? '',
    updated_at: item.updated_at ?? '',
    started_at: item.started_at ?? null,
    finished_at: item.finished_at ?? null,
    is_deleted: Boolean(item.is_deleted)
  }
}

export async function createSessionRun(payload: CreateSessionRunPayload) {
  const response = await service<any>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/create_run',
    method: 'post',
    data: {
      id: payload.id,
      template_id: payload.templateId,
      mode: payload.mode,
      dataset_id: payload.datasetId,
      ...(payload.algorithm ? { algorithm: payload.algorithm } : {}),
      ...(payload.sourceRunId !== undefined ? { source_run_id: payload.sourceRunId } : {}),
      ...(payload.title ? { title: payload.title } : {})
    }
  })

  return unwrapAssistantResponse(response, '创建会话实验失败')
}

export async function listSessionRuns(payload: ListSessionRunsPayload) {
  const response = await service<Record<string, any>[]>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/list_run',
    method: 'get',
    params: {
      id: payload.id
    }
  })

  const data = unwrapAssistantResponse<Record<string, any>[]>(response, '查询会话实验失败')
  return (data || []).map((item) => normalizeSessionRun(item)).filter((item) => !item.is_deleted)
}

export async function cancelSessionRun(payload: CancelSessionRunPayload) {
  const response = await service<any>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/cancel_run',
    method: 'post',
    data: {
      id: payload.id,
      run_id: payload.runId
    }
  })

  return unwrapAssistantResponse(response, '取消会话实验失败')
}

export async function deleteSessionRun(payload: DeleteSessionRunPayload) {
  const response = await service<any>({
    baseURL: BACKEND_BASE_URL,
    url: '/session/delete_run',
    method: 'post',
    data: {
      id: payload.id,
      run_id: payload.runId
    }
  })

  return unwrapAssistantResponse(response, '删除会话实验失败')
}

// Placeholder for future "get messages by session" API integration.
