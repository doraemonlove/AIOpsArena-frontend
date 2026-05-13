<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound, Close, Delete, Plus, Promotion, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElScrollbar } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getToken, localGet, localSet, message } from '@/core/madison/utils'
import { Madison } from '@/core/madison'
import { Login } from '@/core/madison-addon-login'
import {
  type AssistantStreamPart,
  createAssistantSession,
  type SessionRun,
  deleteAssistantSession,
  getAssistantSession,
  listAssistantSessions,
  normalizeAssistantSession,
  runAssistantSSE,
  showAssistantRequestError
} from '@/core/madison-addon-platform-assistant'
import {
  PLATFORM_ASSISTANT_APP_NAME,
  type AssistantSessionDetail,
  type AssistantSessionEvent,
  type AssistantSession,
  type AssistantSessionApiItem,
  type ChatMessage,
  type ChatMessageRole
} from '@/core/madison-addon-platform-assistant'
import SessionRunPanel from './SessionRunPanel.vue'
import { useSessionRuns } from './useSessionRuns'

const props = defineProps<{
  userId?: string | number | null
}>()

const { t, locale } = useI18n()
const router = useRouter()
const madison = Madison.getInstance()
const logged = madison.login.logged
const isOpen = ref(false)
const isLoadingSessions = ref(false)
const isCreatingSession = ref(false)
const deletingSessionId = ref('')
const loadingHistorySessionId = ref('')
const isSending = ref(false)
const listError = ref('')
const sseError = ref('')
const authHint = ref('')
const sessions = ref<AssistantSession[]>([])
const activeSessionId = ref<string>('')
const draft = ref('')
const messageScrollRef = ref<InstanceType<typeof ElScrollbar>>()
const syncedUserId = ref('')

const activeSession = computed(() =>
  sessions.value.find((session) => session.sessionId === activeSessionId.value) || null
)
const activeSessionRecordId = computed(() => {
  if (!activeSession.value) return ''
  return activeSession.value.id > 0 ? String(activeSession.value.id) : ''
})
const loadedHistorySessionIds = ref<string[]>([])
const {
  activeRuns,
  activeRunsLoading,
  activeRunsError,
  cancelingRunIds,
  deletingRunIds,
  fetchSessionRuns,
  requestCancelRun,
  requestDeleteRun,
  clearSessionRuns
} = useSessionRuns({
  isOpen,
  activeSessionKey: activeSessionId,
  activeSessionRecordId,
  onTerminalTransition: ({ sessionRecordId, run, nextStatus }) => {
    insertRunSystemMessage(sessionRecordId, run, nextStatus)
  }
})

const resolvedUserId = computed(() => {
  if (syncedUserId.value) return syncedUserId.value
  return getUserIdCandidates(false)[0] || ''
})

const hasAuthToken = computed(() => !!getToken())
const isAuthRequired = computed(() => !hasAuthToken.value || !!authHint.value)

watch(isOpen, async (open) => {
  if (!open) return
  await syncResolvedUserIdAsync()
  await loadSessions()
  await nextTick()
  scrollMessagesToBottom()
})

watch(
  logged,
  async () => {
    await syncResolvedUserIdAsync()
  },
  { immediate: true }
)

watch(
  () => madison.testbed.testbeds.value.map((item) => item.createdPersonId).join(','),
  async () => {
    if (resolvedUserId.value) return
    await syncResolvedUserIdAsync()
  }
)

watch(activeSessionId, async (sessionId) => {
  if (!sessionId) return
  await loadSessionHistory(sessionId)
})

watch(
  () => activeSession.value?.messages.length,
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  }
)

async function loadSessions() {
  await syncResolvedUserIdAsync()
  if (isLoadingSessions.value) return
  if (!hasAuthToken.value) {
    enterAuthRequiredState(t('PlatformAssistant.Auth.ViewSessions'))
    return
  }

  isLoadingSessions.value = true
  listError.value = ''
  try {
    const response = await listAssistantSessions({
      app_name: PLATFORM_ASSISTANT_APP_NAME
    })
    const data = response.data
    if (!data || data.code !== 0) {
      throw new Error(data?.message || t('PlatformAssistant.Errors.ListSessions'))
    }

    const sessionMap = new Map(sessions.value.map((session) => [session.sessionId, session]))
    const mergedSessions = data.data.map((item: AssistantSessionApiItem) => {
      const existing = sessionMap.get(item.session_id)
      const normalized = normalizeAssistantSession(item, existing?.id)
      normalized.messages = existing?.messages || []
      return normalized
    })

    sessions.value = mergedSessions
    authHint.value = ''

    if (activeSessionId.value) {
      const exists = mergedSessions.some((item) => item.sessionId === activeSessionId.value)
      if (!exists) {
        activeSessionId.value = mergedSessions[0]?.sessionId || ''
      }
    } else {
      activeSessionId.value = mergedSessions[0]?.sessionId || ''
    }

    if (activeSessionId.value) {
      await loadSessionHistory(activeSessionId.value, true)
    }
  } catch (error) {
    if (handleAssistantAuthError(error, t('PlatformAssistant.Auth.ViewSessions'))) return
    listError.value = error instanceof Error ? error.message : t('PlatformAssistant.Errors.ListSessions')
    showAssistantRequestError(t('PlatformAssistant.Errors.ListSessions'), error)
  } finally {
    isLoadingSessions.value = false
  }
}

async function handleCreateSession() {
  await syncResolvedUserIdAsync()
  if (isCreatingSession.value) return
  if (!hasAuthToken.value) {
    enterAuthRequiredState(t('PlatformAssistant.Auth.CreateSession'))
    return
  }

  isCreatingSession.value = true
  try {
    const response = await createAssistantSession({
      app_name: PLATFORM_ASSISTANT_APP_NAME
    })
    const data = response.data
    if (!data || data.code !== 0) {
      throw new Error(data?.message || t('PlatformAssistant.Errors.CreateSession'))
    }

    const normalized = normalizeAssistantSession(data.data)
    const exists = sessions.value.find((session) => session.sessionId === normalized.sessionId)
    if (!exists) {
      sessions.value.unshift(normalized)
    } else {
      Object.assign(exists, normalized)
    }
    authHint.value = ''
    activeSessionId.value = normalized.sessionId
    markSessionHistoryLoaded(normalized.sessionId)
  } catch (error) {
    if (handleAssistantAuthError(error, t('PlatformAssistant.Auth.CreateSession'))) return
    showAssistantRequestError(t('PlatformAssistant.Errors.CreateSession'), error)
  } finally {
    isCreatingSession.value = false
  }
}

async function handleDeleteSession(session: AssistantSession) {
  try {
    await ElMessageBox.confirm(t('PlatformAssistant.Session.DeleteConfirm', { title: getSessionTitle(session) }), t('PlatformAssistant.Session.DeleteTitle'), {
      type: 'warning',
      confirmButtonText: t('PlatformAssistant.Actions.Delete'),
      cancelButtonText: t('PlatformAssistant.Actions.Cancel')
    })
  } catch (_) {
    return
  }

  deletingSessionId.value = session.sessionId
  try {
    await deleteAssistantSession({
      id: session.id
    })
    sessions.value = sessions.value.filter((item) => item.sessionId !== session.sessionId)
    loadedHistorySessionIds.value = loadedHistorySessionIds.value.filter((item) => item !== session.sessionId)
    clearSessionRuns(String(session.id))
    if (activeSessionId.value === session.sessionId) {
      activeSessionId.value = sessions.value[0]?.sessionId || ''
    }
    message(t('PlatformAssistant.Session.Deleted'), 'success')
  } catch (error) {
    showAssistantRequestError(t('PlatformAssistant.Errors.DeleteSession'), error)
  } finally {
    deletingSessionId.value = ''
  }
}

async function sendMessage() {
  await sendMessageText(draft.value.trim())
}

async function sendMessageText(text: string) {
  await syncResolvedUserIdAsync()
  if (!text || isSending.value) return
  if (!hasAuthToken.value) {
    enterAuthRequiredState(t('PlatformAssistant.Auth.Chat'))
    return
  }
  if (!ensureUserId(t('PlatformAssistant.Errors.MissingUserIdSend'))) return

  let session = activeSession.value
  if (!session) {
    await handleCreateSession()
    session = activeSession.value
  }
  if (!session) {
    message(t('PlatformAssistant.Errors.UnavailableSession'))
    return
  }

  const userMessage: ChatMessage = {
    id: createMessageId('user'),
    role: 'user',
    content: text,
    createdAt: Date.now(),
    status: 'done'
  }
  const streamGroupId = createMessageId('assistant-stream')

  session.messages.push(userMessage)
  session.title = getSessionTitle(session)
  markSessionHistoryLoaded(session.sessionId)
  if (draft.value.trim() === text) {
    draft.value = ''
  }
  isSending.value = true
  sseError.value = ''

  try {
    await runAssistantSSEWithFallback(session.sessionId, text, streamGroupId)
  } catch (error) {
    if (handleAssistantAuthError(error, t('PlatformAssistant.Auth.Chat'))) {
      const current = ensureStreamAnswerMessage(session.sessionId, streamGroupId)
      if (current) {
        current.status = 'error'
        current.content = t('PlatformAssistant.Errors.LoginExpired')
      }
      return
    }
    const current = ensureStreamAnswerMessage(session.sessionId, streamGroupId)
    if (current) {
      current.status = 'error'
      if (!current.content) {
        current.content = t('PlatformAssistant.Errors.ReplyInterrupted')
      }
    }
    showAssistantRequestError(t('PlatformAssistant.Errors.ChatFailed'), error)
  } finally {
    isSending.value = false
    if (activeSessionRecordId.value) {
      await fetchSessionRuns(activeSessionRecordId.value, true)
    }
  }
}

function ensureUserId(errorText: string) {
  if (getUserIdCandidates().length > 0) return true
  listError.value = errorText || t('PlatformAssistant.Errors.MissingUserId')
  message(errorText || t('PlatformAssistant.Errors.MissingUserId'))
  return false
}

function toggleOpen() {
  if (!isOpen.value && hasAuthToken.value && authHint.value) {
    authHint.value = ''
  }
  isOpen.value = !isOpen.value
}

async function selectSession(sessionId: string) {
  activeSessionId.value = sessionId
  await loadSessionHistory(sessionId, true)
}

async function loadSessionHistory(sessionId: string, force = false) {
  await syncResolvedUserIdAsync()
  if (!ensureUserId(t('PlatformAssistant.Errors.MissingUserId'))) return
  if (loadingHistorySessionId.value === sessionId) return

  const session = sessions.value.find((item) => item.sessionId === sessionId)
  if (!session) return
  if (!force && loadedHistorySessionIds.value.includes(sessionId)) return
  if (!force && session.messages.length > 0) {
    markSessionHistoryLoaded(sessionId)
    return
  }

  if (force) {
    loadedHistorySessionIds.value = loadedHistorySessionIds.value.filter((item) => item !== sessionId)
  }

  loadingHistorySessionId.value = sessionId
  try {
    const detail = await getAssistantSessionWithFallback(sessionId)
    const historyMessages = normalizeSessionHistoryMessages(detail)
    const current = sessions.value.find((item) => item.sessionId === sessionId)
    if (!current) return
    const localSystemMessages = current.messages.filter((item) => isLocalSystemMessage(item))
    current.messages = mergeMessages(historyMessages, localSystemMessages)
    current.state = detail.state || current.state
    markSessionHistoryLoaded(sessionId)
  } catch (error) {
    showAssistantRequestError(t('PlatformAssistant.Errors.LoadHistory'), error)
  } finally {
    if (loadingHistorySessionId.value === sessionId) {
      loadingHistorySessionId.value = ''
    }
  }
}

function onInputKeydown(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) return
  if (event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  sendMessage()
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function findSessionMessage(sessionId: string, messageId: string) {
  const session = sessions.value.find((item) => item.sessionId === sessionId)
  return session?.messages.find((item) => item.id === messageId)
}

function findStreamMessages(sessionId: string, streamGroupId: string) {
  const session = sessions.value.find((item) => item.sessionId === sessionId)
  if (!session) return []
  return session.messages.filter((item) => item.meta?.streamGroupId === streamGroupId)
}

function findLatestStreamMessage(sessionId: string, streamGroupId: string) {
  const streamMessages = findStreamMessages(sessionId, streamGroupId)
  return streamMessages[streamMessages.length - 1]
}

function ensureStreamAnswerMessage(sessionId: string, streamGroupId: string) {
  const session = sessions.value.find((item) => item.sessionId === sessionId)
  if (!session) return null

  const existing = session.messages.find(
    (item) => item.meta?.streamGroupId === streamGroupId && item.role === 'assistant'
  )
  if (existing) return existing

  const messageItem: ChatMessage = {
    id: createMessageId('assistant'),
    role: 'assistant',
    content: '',
    createdAt: Date.now(),
    status: 'streaming',
    meta: {
      streamGroupId
    }
  }
  session.messages.push(messageItem)
  return messageItem
}

function appendStreamingParts(sessionId: string, streamGroupId: string, parts: AssistantStreamPart[]) {
  const session = sessions.value.find((item) => item.sessionId === sessionId)
  if (!session || !parts.length) return

  parts.forEach((part) => {
    const role: ChatMessageRole = part.kind === 'answer' ? 'assistant' : 'system'
    const lastMessage = findLatestStreamMessage(sessionId, streamGroupId)
    const isSameKind =
      !!lastMessage &&
      lastMessage.role === role &&
      (
        (part.kind === 'answer' && !lastMessage.meta?.kind) ||
        lastMessage.meta?.kind === part.kind
      ) &&
      lastMessage.status === 'streaming'

    if (lastMessage && !isSameKind && lastMessage.status === 'streaming') {
      lastMessage.status = lastMessage.content ? 'done' : 'error'
    }

    if (part.kind === 'answer' && !lastMessage) {
      const answerMessage = ensureStreamAnswerMessage(sessionId, streamGroupId)
      if (answerMessage) {
        answerMessage.content += part.content
        return
      }
    }

    if (isSameKind && lastMessage) {
      lastMessage.content += part.content
      return
    }

    session.messages.push({
      id: createMessageId(role),
      role,
      content: part.content,
      createdAt: Date.now(),
      status: 'streaming',
      meta: {
        ...(part.kind === 'answer' ? {} : { kind: part.kind }),
        streamGroupId
      }
    })
  })

  nextTick(scrollMessagesToBottom)
}

function mergeMessages(historyMessages: ChatMessage[], localMessages: ChatMessage[]) {
  const merged = [...historyMessages]
  const existingIds = new Set(historyMessages.map((item) => item.id))
  for (const item of localMessages) {
    if (!existingIds.has(item.id)) {
      merged.push(item)
    }
  }
  return merged.sort((a, b) => a.createdAt - b.createdAt)
}

function isLocalSystemMessage(messageItem: ChatMessage) {
  return messageItem.role === 'system' && messageItem.meta?.localOnly === true
}

function getRunTransitionMessage(run: SessionRun, status: string) {
  if (status === 'finished') {
    return t('PlatformAssistant.RunMessage.Finished', { runId: run.run_id })
  }
  if (status === 'failed') {
    return t('PlatformAssistant.RunMessage.Failed', { runId: run.run_id })
  }
  return t('PlatformAssistant.RunMessage.Canceled', { runId: run.run_id })
}

function getRunMessageActions(run: SessionRun, status: string) {
  if (status === 'finished') {
    return [
      {
        key: 'analyze-result',
        label: t('PlatformAssistant.Actions.AnalyzeResult'),
        prompt: t('PlatformAssistant.RunMessage.AnalyzeResultPrompt', {
          runId: run.run_id
        })
      }
    ]
  }

  if (status === 'failed') {
    return [
      {
        key: 'analyze-failure',
        label: t('PlatformAssistant.Actions.AnalyzeFailure'),
        prompt: t('PlatformAssistant.RunMessage.AnalyzeFailurePrompt', {
          runId: run.run_id
        })
      }
    ]
  }

  return []
}

function insertRunSystemMessage(sessionId: string, run: SessionRun, status: string) {
  const session = sessions.value.find((item) => String(item.id) === sessionId)
  if (!session) return

  const messageId = `system-run-${sessionId}-${run.run_id}-${status}`
  const exists = session.messages.some((item) => item.id === messageId)
  if (exists) return

  session.messages.push({
    id: messageId,
    role: 'system',
    content: getRunTransitionMessage(run, status),
    createdAt: Date.now(),
    status: 'done',
    meta: {
      localOnly: true,
      source: 'session-run',
      runId: run.run_id,
      runStatus: status,
      actions: getRunMessageActions(run, status)
    }
  })
}

async function handleRefreshRuns() {
  if (!activeSessionRecordId.value) return
  await fetchSessionRuns(activeSessionRecordId.value)
}

async function handleCancelRun(run: SessionRun) {
  const sessionId = activeSessionRecordId.value
  if (!sessionId) return

  try {
    await ElMessageBox.confirm(
      t('PlatformAssistant.RunPanel.CancelConfirm', { runId: run.run_id }),
      t('PlatformAssistant.RunPanel.CancelTitle'),
      {
        type: 'warning',
        confirmButtonText: t('PlatformAssistant.Actions.CancelRun'),
        cancelButtonText: t('PlatformAssistant.Actions.Cancel')
      }
    )
  } catch (_) {
    return
  }

  try {
    await requestCancelRun(sessionId, run.run_id)
    message(t('PlatformAssistant.RunPanel.CancelSubmitted'), 'success')
    await fetchSessionRuns(sessionId, true)
  } catch (error) {
    showAssistantRequestError(t('PlatformAssistant.Errors.CancelRun'), error)
  }
}

async function handleDeleteRun(run: SessionRun) {
  const sessionId = activeSessionRecordId.value
  if (!sessionId) return

  try {
    await ElMessageBox.confirm(
      t('PlatformAssistant.RunPanel.DeleteConfirm', { runId: run.run_id }),
      t('PlatformAssistant.RunPanel.DeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('PlatformAssistant.Actions.DeleteRun'),
        cancelButtonText: t('PlatformAssistant.Actions.Cancel')
      }
    )
  } catch (_) {
    return
  }

  try {
    await requestDeleteRun(sessionId, run.run_id)
    message(t('PlatformAssistant.RunPanel.DeleteSuccess'), 'success')
  } catch (error) {
    showAssistantRequestError(t('PlatformAssistant.Errors.DeleteRun'), error)
  }
}

async function handleAnalyzeRun(run: SessionRun) {
  const prompt =
    run.status === 'failed'
      ? t('PlatformAssistant.RunMessage.AnalyzeFailurePrompt', { runId: run.run_id })
      : t('PlatformAssistant.RunMessage.AnalyzeResultPrompt', { runId: run.run_id })
  await sendMessageText(prompt)
}

async function handleSystemActionClick(action: Record<string, any>) {
  const prompt = typeof action?.prompt === 'string' ? action.prompt : ''
  if (!prompt) return
  await sendMessageText(prompt)
}

async function getAssistantSessionWithFallback(sessionId: string) {
  const candidates = getUserIdCandidates()
  let lastError: unknown = null

  for (const userId of candidates) {
    try {
      const detail = await getAssistantSession({
        app_name: PLATFORM_ASSISTANT_APP_NAME,
        user_id: userId,
        session_id: sessionId
      })
      syncSuccessfulUserId(userId)
      return detail
    } catch (error) {
      lastError = error
      if (!shouldRetryAssistantUserId(error)) {
        throw error
      }
    }
  }

  throw lastError || new Error(t('PlatformAssistant.Errors.LoadHistory'))
}

async function runAssistantSSEWithFallback(sessionId: string, text: string, assistantMessageId: string) {
  const candidates = getUserIdCandidates()
  let lastError: unknown = null

  for (const userId of candidates) {
    try {
      await runAssistantSSE(
        {
          app_name: PLATFORM_ASSISTANT_APP_NAME,
          user_id: userId,
          session_id: sessionId,
          new_message: {
            role: 'user',
            parts: [{ text }]
          }
        },
        {
          onParts: (parts) => {
            appendStreamingParts(sessionId, assistantMessageId, parts)
          },
          onText: (chunk) => {
            const current = ensureStreamAnswerMessage(sessionId, assistantMessageId)
            if (!current) return
            current.content += chunk
            current.status = 'streaming'
            nextTick(scrollMessagesToBottom)
          },
          onFinish: () => {
            const streamMessages = findStreamMessages(sessionId, assistantMessageId)
            if (!streamMessages.length) {
              const fallbackMessage = ensureStreamAnswerMessage(sessionId, assistantMessageId)
              if (fallbackMessage) {
                fallbackMessage.status = 'error'
                fallbackMessage.content = t('PlatformAssistant.Errors.EmptyReply')
              }
              return
            }
            streamMessages.forEach((item) => {
              item.status = item.content ? 'done' : 'error'
            })
          },
          onError: (error) => {
            sseError.value = error.message
          }
        }
      )
      syncSuccessfulUserId(userId)
      return
    } catch (error) {
      lastError = error
      if (!shouldRetryAssistantUserId(error)) {
        throw error
      }
    }
  }

  throw lastError || new Error(t('PlatformAssistant.Errors.ChatFailed'))
}

function scrollMessagesToBottom() {
  messageScrollRef.value?.setScrollTop(Number.MAX_SAFE_INTEGER)
}

function markSessionHistoryLoaded(sessionId: string) {
  if (loadedHistorySessionIds.value.includes(sessionId)) return
  loadedHistorySessionIds.value = [...loadedHistorySessionIds.value, sessionId]
}

async function syncResolvedUserIdAsync() {
  const immediateCandidate = getUserIdCandidates(false)[0] || ''
  if (immediateCandidate) {
    syncedUserId.value = immediateCandidate
    return
  }

  const fromTestbed = resolveUserIdFromTestbeds(false)
  if (fromTestbed) {
    syncedUserId.value = fromTestbed
    return
  }

  try {
    await madison.testbed.waitingForTestbeds
  } catch (_) {}

  const delayedFromTestbed = resolveUserIdFromTestbeds(false)
  if (delayedFromTestbed) {
    syncedUserId.value = delayedFromTestbed
    return
  }

  syncedUserId.value = ''
}

function resolveUserIdFromTestbeds(allowWait: boolean) {
  if (allowWait) {
    void madison.testbed.waitingForTestbeds.catch(() => undefined)
  }
  const testbeds = madison.testbed.testbeds.value
  const firstOwnedId = testbeds.find((item) => normalizeUserId(item.createdPersonId))?.createdPersonId
  const normalized = normalizeUserId(firstOwnedId)
  if (normalized) {
    localSet(Login.USER_ID_KEY, normalized)
  }
  return normalized
}

function getUserIdCandidates(includeTestbed: boolean = true) {
  const candidates = [
    normalizeUserId(syncedUserId.value),
    normalizeUserId(props.userId),
    normalizeUserId(localGet(Login.USER_ID_KEY, '') || ''),
    normalizeUserId(resolveUserIdFromToken()),
    includeTestbed ? normalizeUserId(resolveUserIdFromTestbeds(false)) : ''
  ]

  return candidates.filter((item, index) => !!item && candidates.indexOf(item) === index)
}

function normalizeUserId(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function syncSuccessfulUserId(userId: string) {
  const normalized = normalizeUserId(userId)
  if (!normalized) return
  syncedUserId.value = normalized
  localSet(Login.USER_ID_KEY, normalized)
}

function shouldRetryAssistantUserId(error: unknown) {
  const text = error instanceof Error ? error.message : String(error || '')
  const normalized = text.toLowerCase()
  return normalized.includes('404') || normalized.includes('session not found') || normalized.includes('not found')
}

function extractUserIdFromPayload(payload: Record<string, unknown>) {
  const directCandidate =
    payload.user_id ||
    payload.userId ||
    payload.uid ||
    payload.id ||
    payload.sub

  const normalizedDirect = normalizeUserId(directCandidate)
  if (normalizedDirect) return normalizedDirect

  const nestedSources = [payload.user, payload.data, payload.profile]
  for (const source of nestedSources) {
    if (!source || typeof source !== 'object') continue
    const candidate =
      (source as Record<string, unknown>).user_id ||
      (source as Record<string, unknown>).userId ||
      (source as Record<string, unknown>).uid ||
      (source as Record<string, unknown>).id ||
      (source as Record<string, unknown>).sub
    const normalized = normalizeUserId(candidate)
    if (normalized) return normalized
  }

  return ''
}

function normalizeSessionHistoryMessages(detail: AssistantSessionDetail): ChatMessage[] {
  return detail.events
    .flatMap((event, index) => normalizeSessionEventToMessages(event, index))
}

function normalizeSessionEventToMessages(event: AssistantSessionEvent, index: number): ChatMessage[] {
  const role = normalizeEventRole(event)
  if (!role) return []

  const createdAt = normalizeEventTime(event, index)
  const parts = extractEventParts(event)
  if (!parts.length) return []

  return parts.map((part, partIndex) => ({
    id: String(event.id || `${role}-${index}-${Date.now()}`) + `-${part.kind}-${partIndex}`,
    role: part.kind === 'answer' ? role : 'system',
    content: part.content,
    createdAt: createdAt + partIndex,
    status: 'done' as const,
    meta: {
      kind: part.kind
    }
  }))
}

function normalizeEventRole(event: AssistantSessionEvent): ChatMessageRole | '' {
  const rawRole =
    event.role ||
    event.author ||
    event.content?.role ||
    (typeof event.type === 'string' ? event.type : '')

  const normalized = String(rawRole || '').toLowerCase()
  if (normalized === 'user') return 'user'
  if (['system', 'tool', 'notice'].includes(normalized)) return 'system'
  if (
    ['assistant', 'model', 'agent', 'bot', 'root_agent'].includes(normalized) ||
    normalized.endsWith('_agent')
  ) {
    return 'assistant'
  }
  return ''
}

function normalizeEventTime(event: AssistantSessionEvent, index: number) {
  const raw = event.timestamp || event.created_at || event.updated_at
  if (typeof raw === 'number') {
    return raw > 1e12 ? raw : raw * 1000
  }
  if (typeof raw === 'string') {
    const parsed = new Date(raw).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  return Date.now() + index
}

function extractEventParts(event: AssistantSessionEvent) {
  const rawParts = Array.isArray(event.content?.parts) ? event.content.parts : []
  const parts: Array<{ kind: 'answer' | 'thought' | 'tool-call' | 'tool-response'; content: string }> = []

  rawParts.forEach((part) => {
    if (!part || typeof part !== 'object') return

    if (typeof part.text === 'string' && part.text.trim()) {
      parts.push({
        kind: part.thought === true ? 'thought' : 'answer',
        content: part.text.trim()
      })
    }

    if (part.functionCall && typeof part.functionCall === 'object') {
      const functionCall = part.functionCall as Record<string, unknown>
      const name = typeof functionCall.name === 'string' ? functionCall.name : 'unknown_tool'
      const args = formatJsonBlock(functionCall.args)
      parts.push({
        kind: 'tool-call',
        content: args ? `${name}\n${args}` : name
      })
    }

    if (part.functionResponse && typeof part.functionResponse === 'object') {
      const functionResponse = part.functionResponse as Record<string, unknown>
      const name = typeof functionResponse.name === 'string' ? functionResponse.name : 'unknown_tool'
      const response = formatJsonBlock(functionResponse.response)
      parts.push({
        kind: 'tool-response',
        content: response ? `${name}\n${response}` : name
      })
    }
  })

  return parts
}

function formatJsonBlock(value: unknown) {
  if (value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch (_) {
    return String(value)
  }
}

function enterAuthRequiredState(hint: string) {
  authHint.value = hint
  listError.value = ''
  sseError.value = ''
  sessions.value = []
  activeSessionId.value = ''
}

function handleAssistantAuthError(error: unknown, hint: string) {
  if (!isAuthError(error)) return false
  enterAuthRequiredState(hint)
  return true
}

function isAuthError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error || '')
  const normalized = text.toLowerCase()
  return (
    normalized.includes('token expired') ||
    normalized.includes('unauthorized') ||
    normalized.includes('401') ||
    normalized.includes('not logged in') ||
    normalized.includes('please login') ||
    normalized.includes('please log in') ||
    normalized.includes('invalid token')
  )
}

function toLogin() {
  router.push({ name: 'login' })
}

function resolveUserIdFromToken() {
  const token = getToken()
  if (!token || token.split('.').length < 2) return ''

  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    const data = JSON.parse(decoded) as Record<string, unknown>
    return extractUserIdFromPayload(data)
  } catch (_) {
    return ''
  }
}

function getSessionTitle(session: AssistantSession) {
  const sessionId = session.sessionId?.trim()
  const normalizedTitle = session.title?.trim() || ''
  if (normalizedTitle && !['新会话', 'new session'].includes(normalizedTitle.toLowerCase())) {
    return normalizedTitle
  }
  if (sessionId) return sessionId
  const firstUserMessage = session.messages.find((item) => item.role === 'user')?.content || ''
  return firstUserMessage.slice(0, 20) || ''
}

function formatSessionTime(session: AssistantSession) {
  const source = session.updatedAt || session.createdAt
  if (!source) return t('PlatformAssistant.Session.LocalCached')

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return source

  const now = new Date()
  const sameYear = now.getFullYear() === date.getFullYear()
  const sameDay =
    sameYear &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  const currentLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  const timeLabel = date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' })

  if (sameDay) {
    return t('PlatformAssistant.Session.TodayAt', { time: timeLabel })
  }

  if (sameYear) {
    return locale.value === 'zh-CN'
      ? `${date.getMonth() + 1}${t('PlatformAssistant.Session.Month')}${date.getDate()}${t('PlatformAssistant.Session.Day')} ${timeLabel}`
      : `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()} ${timeLabel}`
  }

  return date.toLocaleString(currentLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMessageStatusText(status?: ChatMessage['status']) {
  if (status === 'streaming') return t('PlatformAssistant.Message.Streaming')
  if (status === 'error') return t('PlatformAssistant.Message.Error')
  return ''
}

function getMessageKindLabel(messageItem: ChatMessage) {
  const kind = messageItem.meta?.kind
  if (kind === 'thought') return t('PlatformAssistant.MessageKind.Thought')
  if (kind === 'tool-call') return t('PlatformAssistant.MessageKind.ToolCall')
  if (kind === 'tool-response') return t('PlatformAssistant.MessageKind.ToolResponse')
  if (messageItem.role === 'assistant') return t('PlatformAssistant.MessageKind.Assistant')
  if (messageItem.role === 'system') return t('PlatformAssistant.MessageKind.System')
  return ''
}
</script>

<template>
  <div class="platform-assistant">
    <transition name="assistant-panel">
      <div
        v-if="isOpen"
        class="assistant-overlay"
        @click="toggleOpen"
      >
        <section
          class="assistant-panel"
          @click.stop
        >
          <el-button
            class="assistant-panel__close"
            circle
            text
            :icon="Close"
            @click="toggleOpen"
          />
          <div class="assistant-sidebar">
            <div class="assistant-sidebar__header">
              <div>
                <div class="assistant-sidebar__title">{{ t('PlatformAssistant.Sidebar.Title') }}</div>
                <div class="assistant-sidebar__subtitle">{{ t('PlatformAssistant.Sidebar.Subtitle') }}</div>
              </div>
            </div>

            <div class="assistant-sidebar__actions">
              <el-button
                class="assistant-sidebar__create"
                type="primary"
                :icon="Plus"
                :loading="isCreatingSession"
                :disabled="isAuthRequired"
                @click="handleCreateSession"
              >
                {{ t('PlatformAssistant.Actions.NewSession') }}
              </el-button>
              <el-button
                circle
                :icon="Refresh"
                :loading="isLoadingSessions"
                :disabled="isAuthRequired"
                @click="loadSessions"
              />
            </div>

            <div
              v-if="isAuthRequired"
              class="assistant-auth"
            >
              <div class="assistant-auth__title">{{ t('PlatformAssistant.Auth.LoginTitle') }}</div>
              <div class="assistant-auth__desc">
                {{ authHint || t('PlatformAssistant.Auth.LoginDescription') }}
              </div>
              <el-button
                type="primary"
                plain
                @click="toLogin"
              >
                {{ t('PlatformAssistant.Actions.GoLogin') }}
              </el-button>
            </div>

            <div
              v-else-if="listError"
              class="assistant-sidebar__error"
            >
              {{ listError }}
            </div>

            <el-scrollbar class="assistant-sidebar__list">
              <div
                v-for="session in sessions"
                :key="session.sessionId"
                class="assistant-session"
                :class="{ 'assistant-session--active': session.sessionId === activeSessionId }"
                role="button"
                tabindex="0"
                @click="selectSession(session.sessionId)"
              >
                <div class="assistant-session__row">
                  <div class="assistant-session__title">{{ getSessionTitle(session) }}</div>
                  <el-button
                    class="assistant-session__delete"
                    circle
                    text
                    :icon="Delete"
                    :loading="deletingSessionId === session.sessionId"
                    @click.stop="handleDeleteSession(session)"
                  />
                </div>
                <div class="assistant-session__meta">
                  {{ formatSessionTime(session) }}
                </div>
              </div>

              <div
                v-if="!sessions.length && !isLoadingSessions && !isAuthRequired"
                class="assistant-sidebar__empty"
              >
                {{ t('PlatformAssistant.Sidebar.EmptySessions') }}
              </div>
            </el-scrollbar>
          </div>

          <div class="assistant-chat">
            <div class="assistant-chat__header">
              <div>
                <div class="assistant-chat__title">
                  {{ activeSession ? getSessionTitle(activeSession) : t('PlatformAssistant.Chat.NoSessionSelected') }}
                </div>
                <div class="assistant-chat__subtitle">
                  app_name: {{ PLATFORM_ASSISTANT_APP_NAME }}
                </div>
              </div>
              <div
                v-if="sseError"
                class="assistant-chat__stream-error"
              >
                {{ sseError }}
              </div>
            </div>

            <el-scrollbar
              ref="messageScrollRef"
              class="assistant-chat__messages"
            >
              <div
                v-if="isAuthRequired"
                class="assistant-chat__placeholder"
              >
                {{ t('PlatformAssistant.Chat.LoginPlaceholder') }}
              </div>

              <div
                v-else-if="!activeSession"
                class="assistant-chat__placeholder"
              >
                {{ t('PlatformAssistant.Chat.SelectSessionPlaceholder') }}
              </div>

              <template v-else>
                <div
                  v-if="!activeSession.messages.length"
                  class="assistant-chat__placeholder"
                >
                  {{ loadingHistorySessionId === activeSession.sessionId ? t('PlatformAssistant.Chat.LoadingHistory') : t('PlatformAssistant.Chat.EmptyMessages') }}
                </div>

                <div
                  v-for="item in activeSession.messages"
                  :key="item.id"
                  class="assistant-message"
                  :class="[
                    `assistant-message--${item.role}`,
                    item.meta?.kind ? `assistant-message--${item.meta.kind}` : ''
                  ]"
                >
                  <div class="assistant-message__bubble">
                    <div
                      v-if="getMessageKindLabel(item)"
                      class="assistant-message__kind"
                    >
                      {{ getMessageKindLabel(item) }}
                    </div>
                    <div class="assistant-message__content">{{ item.content }}</div>
                    <div
                      v-if="item.role === 'system' && item.meta?.actions?.length"
                      class="assistant-message__actions"
                    >
                      <el-button
                        v-for="action in item.meta.actions"
                        :key="action.key || action.label"
                        size="small"
                        text
                        :disabled="isSending || isAuthRequired"
                        @click="handleSystemActionClick(action)"
                      >
                        {{ action.label }}
                      </el-button>
                    </div>
                    <div
                      v-if="getMessageStatusText(item.status)"
                      class="assistant-message__status"
                    >
                      {{ getMessageStatusText(item.status) }}
                    </div>
                  </div>
                </div>
              </template>
            </el-scrollbar>

            <div class="assistant-chat__composer">
              <el-input
                v-model="draft"
                type="textarea"
                resize="none"
                :autosize="{ minRows: 3, maxRows: 6 }"
                :placeholder="t('PlatformAssistant.Chat.InputPlaceholder')"
                @keydown="onInputKeydown"
              />
              <div class="assistant-chat__composer-actions">
                <div class="assistant-chat__composer-tip">
                  {{
                    isAuthRequired
                      ? t('PlatformAssistant.Chat.TipNeedLogin')
                      : resolvedUserId
                        ? t('PlatformAssistant.Chat.TipReady')
                        : t('PlatformAssistant.Chat.TipMissingIdentity')
                  }}
                </div>
                <el-button
                  type="primary"
                  :icon="Promotion"
                  :loading="isSending"
                  :disabled="isAuthRequired || !draft.trim() || !resolvedUserId"
                  @click="sendMessage"
                >
                  {{ t('PlatformAssistant.Actions.Send') }}
                </el-button>
              </div>
            </div>
          </div>

            <SessionRunPanel
            :session-id="activeSessionRecordId"
            :runs="activeRuns"
            :loading="activeRunsLoading"
            :error="activeRunsError"
            :canceling-run-ids="cancelingRunIds"
            :deleting-run-ids="deletingRunIds"
            @refresh="handleRefreshRuns"
            @cancel="handleCancelRun"
            @delete="handleDeleteRun"
            @analyze="handleAnalyzeRun"
          />
        </section>
      </div>
    </transition>

    <el-button
      class="assistant-fab"
      type="primary"
      circle
      :icon="ChatDotRound"
      :title="t('PlatformAssistant.Sidebar.Title')"
      @click="toggleOpen"
    />
  </div>
</template>

<style scoped>
.platform-assistant {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1600;
}

.assistant-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  pointer-events: auto;
  width: 56px;
  height: 56px;
  box-shadow: 0 14px 32px rgba(55, 125, 255, 0.28);
}

.assistant-overlay {
  position: fixed;
  inset: 0;
  pointer-events: auto;
}

.assistant-panel {
  position: absolute;
  right: 24px;
  bottom: 96px;
  display: flex;
  width: min(1300px, calc(100vw - 32px));
  height: min(680px, calc(100vh - 120px));
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
}

.assistant-panel__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.dark .assistant-panel {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 42%),
    linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.96));
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow:
    0 24px 60px rgba(2, 6, 23, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.assistant-sidebar {
  display: flex;
  width: 304px;
  flex-direction: column;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.68);
}

.dark .assistant-sidebar {
  background: rgba(15, 23, 42, 0.7);
}

.assistant-sidebar__header,
.assistant-chat__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
}

.assistant-sidebar__title,
.assistant-chat__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.assistant-sidebar__subtitle,
.assistant-chat__subtitle,
.assistant-chat__composer-tip,
.assistant-session__meta,
.assistant-message__status {
  font-size: 12px;
  color: #64748b;
}

.dark .assistant-sidebar__title,
.dark .assistant-chat__title {
  color: #e2e8f0;
}

.dark .assistant-sidebar__subtitle,
.dark .assistant-chat__subtitle,
.dark .assistant-chat__composer-tip,
.dark .assistant-session__meta,
.dark .assistant-message__status {
  color: #94a3b8;
}

.assistant-sidebar__actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 12px;
}

.assistant-sidebar__create {
  flex: 1;
}

.assistant-sidebar__error,
.assistant-chat__stream-error {
  margin: 0 20px 12px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  padding: 10px 12px;
  font-size: 12px;
  color: #b91c1c;
}

.dark .assistant-sidebar__error,
.dark .assistant-chat__stream-error {
  color: #fca5a5;
}

.assistant-auth {
  margin: 0 20px 12px;
  border: 1px solid rgba(59, 130, 246, 0.14);
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.08);
  padding: 14px;
}

.assistant-auth__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.assistant-auth__desc {
  margin: 6px 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.dark .assistant-auth {
  border-color: rgba(96, 165, 250, 0.16);
  background: rgba(59, 130, 246, 0.12);
}

.dark .assistant-auth__title {
  color: #e2e8f0;
}

.dark .assistant-auth__desc {
  color: #94a3b8;
}

.assistant-sidebar__list {
  padding: 0 12px 16px;
}

.assistant-session {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  padding: 14px 14px 12px;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.assistant-session:hover,
.assistant-session--active {
  border-color: rgba(59, 130, 246, 0.24);
  background: rgba(59, 130, 246, 0.08);
}

.assistant-session__title {
  overflow: hidden;
  color: #0f172a;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.assistant-session__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.assistant-session__delete {
  opacity: 0;
  flex-shrink: 0;
}

.assistant-session:hover .assistant-session__delete,
.assistant-session--active .assistant-session__delete {
  opacity: 1;
}

.dark .assistant-session__title {
  color: #e2e8f0;
}

.assistant-sidebar__empty,
.assistant-chat__placeholder {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  padding: 24px;
}

.assistant-chat {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.assistant-chat__messages {
  flex: 1;
  padding: 0 20px;
}

.assistant-message {
  display: flex;
  margin-bottom: 14px;
}

.assistant-message--user {
  justify-content: flex-end;
}

.assistant-message--assistant {
  justify-content: flex-start;
}

.assistant-message--system {
  justify-content: flex-start;
}

.assistant-message__bubble {
  max-width: min(85%, 720px);
  border-radius: 18px;
  padding: 12px 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.assistant-message__kind {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0.78;
}

.assistant-message--user .assistant-message__bubble {
  background: linear-gradient(135deg, #f9a8d4, #fbcfe8);
  color: #831843;
  border-bottom-right-radius: 6px;
}

.assistant-message--assistant .assistant-message__bubble {
  background: linear-gradient(180deg, rgba(220, 252, 231, 0.92), rgba(240, 253, 244, 0.92));
  color: #14532d;
  border: 1px solid rgba(134, 239, 172, 0.38);
  border-bottom-left-radius: 6px;
  text-align: left;
}

.assistant-message--system .assistant-message__bubble {
  max-width: min(92%, 760px);
  background: linear-gradient(180deg, rgba(254, 249, 195, 0.92), rgba(254, 252, 232, 0.92));
  color: #854d0e;
  border: 1px dashed rgba(234, 179, 8, 0.3);
  border-radius: 16px;
  text-align: left;
}

.dark .assistant-message--assistant .assistant-message__bubble {
  background: rgba(20, 83, 45, 0.34);
  color: #dcfce7;
  border-color: rgba(74, 222, 128, 0.26);
}

.dark .assistant-message--system .assistant-message__bubble {
  background: rgba(113, 63, 18, 0.34);
  color: #fde68a;
  border-color: rgba(250, 204, 21, 0.24);
}

.assistant-message--thought .assistant-message__bubble {
  max-width: min(88%, 760px);
  background: linear-gradient(180deg, rgba(243, 232, 255, 0.94), rgba(250, 245, 255, 0.94));
  color: #6b21a8;
  border: 1px dashed rgba(192, 132, 252, 0.32);
  font-size: 13px;
  text-align: left;
}

.assistant-message--tool-call .assistant-message__bubble,
.assistant-message--tool-response .assistant-message__bubble {
  max-width: min(92%, 760px);
  background: linear-gradient(180deg, rgba(224, 242, 254, 0.94), rgba(240, 249, 255, 0.94));
  color: #0f172a;
  border: 1px solid rgba(125, 211, 252, 0.4);
  font-size: 13px;
  text-align: left;
  overflow-x: auto;
}

.assistant-message--tool-call .assistant-message__content,
.assistant-message--tool-response .assistant-message__content {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.65;
}

.dark .assistant-message--thought .assistant-message__bubble {
  background: rgba(88, 28, 135, 0.34);
  color: #f3e8ff;
  border-color: rgba(192, 132, 252, 0.24);
}

.dark .assistant-message--tool-call .assistant-message__bubble,
.dark .assistant-message--tool-response .assistant-message__bubble {
  background: rgba(12, 74, 110, 0.36);
  color: #e0f2fe;
  border-color: rgba(125, 211, 252, 0.28);
}

.assistant-message__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.assistant-chat__composer {
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  padding: 16px 20px 20px;
  background: rgba(255, 255, 255, 0.6);
}

.dark .assistant-chat__composer {
  background: rgba(15, 23, 42, 0.42);
}

.assistant-chat__composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: all 0.2s ease;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 900px) {
  .platform-assistant {
    inset: 0;
  }

  .assistant-panel {
    right: 16px;
    bottom: 84px;
    width: min(100vw - 16px, 960px);
    height: min(100vh - 92px, 820px);
    flex-direction: column;
  }

  .assistant-fab {
    right: 16px;
    bottom: 16px;
  }

  .assistant-sidebar {
    width: 100%;
    height: 240px;
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .assistant-chat__composer-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
