import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import {
  cancelSessionRun,
  deleteSessionRun,
  listSessionRuns,
  type SessionRun
} from '@/core/madison-addon-platform-assistant'

const ACTIVE_STATUSES = new Set(['waiting', 'starting', 'running'])
const TERMINAL_STATUSES = new Set(['finished', 'failed', 'canceled'])
const POLL_INTERVAL = 4000

function isActiveStatus(status: string) {
  return ACTIVE_STATUSES.has(status)
}

function isTerminalStatus(status: string) {
  return TERMINAL_STATUSES.has(status)
}

function removeItem(items: number[], target: number) {
  return items.filter((item) => item !== target)
}

export function useSessionRuns(options: {
  isOpen: Ref<boolean>
  activeSessionKey: Ref<string>
  activeSessionRecordId: Ref<string>
  onTerminalTransition: (payload: { sessionRecordId: string; run: SessionRun; nextStatus: string }) => void
}) {
  const runsBySessionRecordId = ref<Record<string, SessionRun[]>>({})
  const loadingSessionRecordIds = ref<string[]>([])
  const sessionRunErrors = ref<Record<string, string>>({})
  const cancelingRunIds = ref<number[]>([])
  const deletingRunIds = ref<number[]>([])
  const notifiedRunTransitions = ref<string[]>([])
  const runPollingTimers = new Map<string, number>()
  const runStatusSnapshots = new Map<string, Map<number, string>>()

  const activeRuns = computed(() => runsBySessionRecordId.value[options.activeSessionRecordId.value] || [])
  const activeRunsLoading = computed(() => loadingSessionRecordIds.value.includes(options.activeSessionRecordId.value))
  const activeRunsError = computed(() => sessionRunErrors.value[options.activeSessionRecordId.value] || '')

  function setLoading(sessionRecordId: string, loading: boolean) {
    if (loading) {
      if (!loadingSessionRecordIds.value.includes(sessionRecordId)) {
        loadingSessionRecordIds.value = [...loadingSessionRecordIds.value, sessionRecordId]
      }
      return
    }
    loadingSessionRecordIds.value = loadingSessionRecordIds.value.filter((item) => item !== sessionRecordId)
  }

  function stopPolling(sessionRecordId?: string) {
    if (sessionRecordId) {
      const timer = runPollingTimers.get(sessionRecordId)
      if (timer !== undefined) {
        window.clearTimeout(timer)
        runPollingTimers.delete(sessionRecordId)
      }
      return
    }

    Array.from(runPollingTimers.keys()).forEach((key) => stopPolling(key))
  }

  function schedulePolling(sessionRecordId: string) {
    stopPolling(sessionRecordId)
    if (!options.isOpen.value || options.activeSessionRecordId.value !== sessionRecordId) return

    const runs = runsBySessionRecordId.value[sessionRecordId] || []
    if (!runs.some((item) => isActiveStatus(item.status))) return

    const timer = window.setTimeout(async () => {
      await fetchSessionRuns(sessionRecordId, true)
      if (options.isOpen.value && options.activeSessionRecordId.value === sessionRecordId) {
        schedulePolling(sessionRecordId)
      }
    }, POLL_INTERVAL)

    runPollingTimers.set(sessionRecordId, timer)
  }

  function updateSnapshot(sessionRecordId: string, runs: SessionRun[]) {
    runStatusSnapshots.set(
      sessionRecordId,
      new Map(runs.map((item) => [item.run_id, item.status]))
    )
  }

  function applyRuns(sessionRecordId: string, runs: SessionRun[]) {
    runsBySessionRecordId.value = {
      ...runsBySessionRecordId.value,
      [sessionRecordId]: runs
    }
    updateSnapshot(sessionRecordId, runs)
  }

  function notifyTerminalTransitions(sessionRecordId: string, nextRuns: SessionRun[]) {
    const previousStatuses = runStatusSnapshots.get(sessionRecordId) || new Map<number, string>()
    for (const run of nextRuns) {
      const previousStatus = previousStatuses.get(run.run_id)
      if (!previousStatus || !isActiveStatus(previousStatus) || !isTerminalStatus(run.status)) continue

      const transitionKey = `${sessionRecordId}:${run.run_id}:${run.status}`
      if (notifiedRunTransitions.value.includes(transitionKey)) continue

      notifiedRunTransitions.value = [...notifiedRunTransitions.value, transitionKey]
      options.onTerminalTransition({
        sessionRecordId,
        run,
        nextStatus: run.status
      })
    }
  }

  async function fetchSessionRuns(sessionRecordId: string, silent: boolean = false) {
    if (!sessionRecordId) return []
    if (!silent) {
      setLoading(sessionRecordId, true)
    }

    try {
      sessionRunErrors.value = {
        ...sessionRunErrors.value,
        [sessionRecordId]: ''
      }
      const runs = await listSessionRuns({ id: sessionRecordId })
      notifyTerminalTransitions(sessionRecordId, runs)
      applyRuns(sessionRecordId, runs)
      schedulePolling(sessionRecordId)
      return runs
    } catch (error) {
      const errorText = error instanceof Error ? error.message : '查询会话实验失败'
      sessionRunErrors.value = {
        ...sessionRunErrors.value,
        [sessionRecordId]: errorText
      }
      stopPolling(sessionRecordId)
      return []
    } finally {
      if (!silent) {
        setLoading(sessionRecordId, false)
      }
    }
  }

  async function requestCancelRun(sessionRecordId: string, runId: number) {
    cancelingRunIds.value = [...cancelingRunIds.value, runId]
    try {
      return await cancelSessionRun({
        id: sessionRecordId,
        runId
      })
    } finally {
      cancelingRunIds.value = removeItem(cancelingRunIds.value, runId)
    }
  }

  async function requestDeleteRun(sessionRecordId: string, runId: number) {
    deletingRunIds.value = [...deletingRunIds.value, runId]
    try {
      await deleteSessionRun({
        id: sessionRecordId,
        runId
      })
      const nextRuns = (runsBySessionRecordId.value[sessionRecordId] || []).filter((item) => item.run_id !== runId)
      applyRuns(sessionRecordId, nextRuns)
      schedulePolling(sessionRecordId)
    } finally {
      deletingRunIds.value = removeItem(deletingRunIds.value, runId)
    }
  }

  function clearSessionRuns(sessionRecordId: string) {
    stopPolling(sessionRecordId)
    const nextRunsBySessionRecordId = { ...runsBySessionRecordId.value }
    const nextErrors = { ...sessionRunErrors.value }
    delete nextRunsBySessionRecordId[sessionRecordId]
    delete nextErrors[sessionRecordId]
    runsBySessionRecordId.value = nextRunsBySessionRecordId
    sessionRunErrors.value = nextErrors
    runStatusSnapshots.delete(sessionRecordId)
    notifiedRunTransitions.value = notifiedRunTransitions.value.filter(
      (item) => !item.startsWith(`${sessionRecordId}:`)
    )
  }

  watch(
    [options.isOpen, options.activeSessionKey, options.activeSessionRecordId],
    async ([open, _sessionKey, sessionRecordId], previousValue) => {
      const previousSessionRecordId = previousValue?.[2] || ''
      if (previousSessionRecordId && previousSessionRecordId !== sessionRecordId) {
        stopPolling(previousSessionRecordId)
      }
      if (!open) {
        stopPolling()
        return
      }
      if (!sessionRecordId) return
      await fetchSessionRuns(sessionRecordId)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    runPollingTimers,
    notifiedRunTransitions,
    activeRuns,
    activeRunsLoading,
    activeRunsError,
    cancelingRunIds,
    deletingRunIds,
    fetchSessionRuns,
    requestCancelRun,
    requestDeleteRun,
    clearSessionRuns,
    isActiveStatus
  }
}
