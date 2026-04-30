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
  createAssistantSession,
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
  type ChatMessage
} from '@/core/madison-addon-platform-assistant'

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
const loadedHistorySessionIds = ref<string[]>([])

const resolvedUserId = computed(() => {
  if (syncedUserId.value) return syncedUserId.value
  if (props.userId !== undefined && props.userId !== null && props.userId !== '') {
    return String(props.userId)
  }
  return ''
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

    const messageMap = new Map(sessions.value.map((session) => [session.sessionId, session.messages]))
    const mergedSessions = data.data.map((item: AssistantSessionApiItem) => {
      const normalized = normalizeAssistantSession(item)
      normalized.messages = messageMap.get(normalized.sessionId) || []
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
      app_name: PLATFORM_ASSISTANT_APP_NAME,
      title: t('PlatformAssistant.Session.NewTitle')
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
  await syncResolvedUserIdAsync()
  const text = draft.value.trim()
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
  const assistantMessage: ChatMessage = {
    id: createMessageId('assistant'),
    role: 'assistant',
    content: '',
    createdAt: Date.now(),
    status: 'streaming'
  }

  session.messages.push(userMessage, assistantMessage)
  session.title = session.title || text.slice(0, 20) || t('PlatformAssistant.Session.NewTitle')
  markSessionHistoryLoaded(session.sessionId)
  draft.value = ''
  isSending.value = true
  sseError.value = ''

  try {
    await runAssistantSSE(
      {
        app_name: PLATFORM_ASSISTANT_APP_NAME,
        user_id: resolvedUserId.value!,
        session_id: session.sessionId,
        new_message: {
          role: 'user',
          parts: [{ text }]
        }
      },
      {
        onText: (chunk) => {
          const current = findSessionMessage(session!.sessionId, assistantMessage.id)
          if (!current) return
          current.content += chunk
          current.status = 'streaming'
          nextTick(scrollMessagesToBottom)
        },
        onFinish: () => {
          const current = findSessionMessage(session!.sessionId, assistantMessage.id)
          if (!current) return
          current.status = current.content ? 'done' : 'error'
          if (!current.content) {
            current.content = t('PlatformAssistant.Errors.EmptyReply')
          }
        },
        onError: (error) => {
          sseError.value = error.message
        }
      }
    )
  } catch (error) {
    if (handleAssistantAuthError(error, t('PlatformAssistant.Auth.Chat'))) {
      const current = findSessionMessage(session.sessionId, assistantMessage.id)
      if (current) {
        current.status = 'error'
        current.content = t('PlatformAssistant.Errors.LoginExpired')
      }
      return
    }
    const current = findSessionMessage(session.sessionId, assistantMessage.id)
    if (current) {
      current.status = 'error'
      if (!current.content) {
        current.content = t('PlatformAssistant.Errors.ReplyInterrupted')
      }
    }
    showAssistantRequestError(t('PlatformAssistant.Errors.ChatFailed'), error)
  } finally {
    isSending.value = false
  }
}

function ensureUserId(errorText: string) {
  if (resolvedUserId.value) return true
  listError.value = t('PlatformAssistant.Errors.MissingUserId')
  message(t('PlatformAssistant.Errors.MissingUserId'))
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
  if (!resolvedUserId.value) return
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
    const detail = await getAssistantSession({
      app_name: PLATFORM_ASSISTANT_APP_NAME,
      user_id: resolvedUserId.value,
      session_id: sessionId
    })
    const historyMessages = normalizeSessionHistoryMessages(detail)
    const current = sessions.value.find((item) => item.sessionId === sessionId)
    if (!current) return
    current.messages = historyMessages
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

function onInputKeydown(event: KeyboardEvent) {
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

function scrollMessagesToBottom() {
  messageScrollRef.value?.setScrollTop(Number.MAX_SAFE_INTEGER)
}

function markSessionHistoryLoaded(sessionId: string) {
  if (loadedHistorySessionIds.value.includes(sessionId)) return
  loadedHistorySessionIds.value = [...loadedHistorySessionIds.value, sessionId]
}

async function syncResolvedUserIdAsync() {
  if (props.userId !== undefined && props.userId !== null && props.userId !== '') {
    syncedUserId.value = normalizeUserId(props.userId)
    return
  }

  const storedUserId = normalizeUserId(localGet(Login.USER_ID_KEY, '') || '')
  if (storedUserId) {
    syncedUserId.value = storedUserId
    return
  }

  const fromToken = normalizeUserId(resolveUserIdFromToken())
  if (fromToken) {
    syncedUserId.value = fromToken
    return
  }

  if (hasAuthToken.value) {
    try {
      await madison.testbed.waitingForTestbeds
    } catch (_) {}
  }

  const fromTestbed = resolveUserIdFromTestbeds()
  if (fromTestbed) {
    syncedUserId.value = fromTestbed
    return
  }

  syncedUserId.value = ''
}

function resolveUserIdFromTestbeds() {
  const testbeds = madison.testbed.testbeds.value
  const firstOwnedId = testbeds.find((item) => normalizeUserId(item.createdPersonId))?.createdPersonId
  const normalized = normalizeUserId(firstOwnedId)
  if (normalized) {
    localSet(Login.USER_ID_KEY, normalized)
  }
  return normalized
}

function normalizeUserId(value: unknown) {
  if (value === undefined || value === null) return ''
  const normalized = String(value).trim()
  return /^\d+$/.test(normalized) ? normalized : ''
}

function normalizeSessionHistoryMessages(detail: AssistantSessionDetail) {
  return detail.events
    .map((event, index) => normalizeSessionEventToMessage(event, index))
    .filter((item): item is ChatMessage => !!item)
}

function normalizeSessionEventToMessage(event: AssistantSessionEvent, index: number) {
  const role = normalizeEventRole(event)
  if (!role) return null

  const content = extractEventText(event)
  if (!content) return null

  return {
    id: String(event.id || `${role}-${index}-${Date.now()}`),
    role,
    content,
    createdAt: normalizeEventTime(event, index),
    status: 'done' as const
  }
}

function normalizeEventRole(event: AssistantSessionEvent) {
  const rawRole =
    event.role ||
    event.author ||
    event.content?.role ||
    (typeof event.type === 'string' ? event.type : '')

  const normalized = String(rawRole || '').toLowerCase()
  if (normalized === 'user') return 'user'
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

function extractEventText(event: AssistantSessionEvent) {
  const text = extractDisplayTextFromUnknown(event.content || event)
  return text.trim()
}

function extractDisplayTextFromUnknown(payload: unknown) {
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
          if (part && part.thought === true) {
            continue
          }
          if (part && typeof part.text === 'string') {
            texts.push(part.text)
          }
        }
        continue
      }

      if (key === 'parts' && Array.isArray(child)) {
        for (const part of child as Array<Record<string, unknown>>) {
          if (part && part.thought === true) {
            continue
          }
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
    normalized.includes('login') ||
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
    const candidate = data.user_id || data.userId || data.uid || data.id || data.sub
    return candidate === undefined || candidate === null ? '' : String(candidate)
  } catch (_) {
    return ''
  }
}

function getSessionTitle(session: AssistantSession) {
  if (session.title?.trim()) return session.title
  const firstUserMessage = session.messages.find((item) => item.role === 'user')?.content || ''
  return firstUserMessage.slice(0, 20) || t('PlatformAssistant.Session.NewTitle')
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
                  :class="`assistant-message--${item.role}`"
                >
                  <div class="assistant-message__bubble">
                    <div class="assistant-message__content">{{ item.content }}</div>
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
  width: min(980px, calc(100vw - 32px));
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

.assistant-message__bubble {
  max-width: min(85%, 720px);
  border-radius: 18px;
  padding: 12px 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.assistant-message--user .assistant-message__bubble {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #eff6ff;
  border-bottom-right-radius: 6px;
}

.assistant-message--assistant .assistant-message__bubble {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-bottom-left-radius: 6px;
}

.dark .assistant-message--assistant .assistant-message__bubble {
  background: rgba(30, 41, 59, 0.82);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.16);
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
    width: min(100vw - 16px, 720px);
    height: min(100vh - 92px, 720px);
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
