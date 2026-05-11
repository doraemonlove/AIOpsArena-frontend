export default {
  Sidebar: {
    Title: 'Platform Assistant',
    Subtitle: 'Session management and Q&A entry',
    EmptySessions: 'No sessions yet. Create one to get started.'
  },
  Actions: {
    NewSession: 'New Session',
    Delete: 'Delete',
    Cancel: 'Cancel',
    CancelRun: 'Cancel Run',
    DeleteRun: 'Delete Run',
    AnalyzeResult: 'Analyze Result',
    AnalyzeFailure: 'Analyze Failure',
    GoLogin: 'Sign In',
    Send: 'Send'
  },
  Auth: {
    LoginTitle: 'Sign in to use Platform Assistant',
    LoginDescription: 'Viewing history, creating sessions, and chatting all require sign-in first.',
    ViewSessions: 'Sign in to view Platform Assistant sessions',
    CreateSession: 'Sign in to create assistant sessions',
    Chat: 'Sign in to chat with Platform Assistant'
  },
  Session: {
    NewTitle: 'New Session',
    DeleteTitle: 'Delete Session',
    DeleteConfirm: 'Delete session "{title}"?',
    Deleted: 'Session deleted',
    LocalCached: 'Locally cached session',
    TodayAt: 'Today {time}',
    Month: '',
    Day: ''
  },
  Chat: {
    NoSessionSelected: 'No session selected',
    LoginPlaceholder: 'Sign in to view history and chat with Platform Assistant.',
    SelectSessionPlaceholder: 'Select a session, or send the first message to create one automatically.',
    LoadingHistory: 'Loading message history...',
    EmptyMessages: 'Messages for the current session will appear here.',
    InputPlaceholder: 'Type your question. Enter to send, Shift + Enter for a new line',
    TipNeedLogin: 'Sign in to view sessions and start chatting',
    TipReady: 'Current identity is synced. You can send messages now',
    TipMissingIdentity: 'Current login data is incomplete. Please sign in again'
  },
  RunPanel: {
    Title: 'Session Runs',
    Subtitle: 'Experiments for the current session',
    NoSession: 'Create or select a session first',
    Loading: 'Loading runs for the current session...',
    Empty: 'No experiments have been created in this session yet.',
    Mode: 'Mode',
    Dataset: 'Dataset',
    EvaluationStatus: 'Evaluation',
    CreatedAt: 'Created',
    FinishedAt: 'Finished',
    CancelTitle: 'Cancel Run',
    CancelConfirm: 'Submit a cancel request for run_id={runId}?',
    CancelSubmitted: 'Cancel request submitted',
    DeleteTitle: 'Delete Run',
    DeleteConfirm: 'Delete run_id={runId} from this session?',
    DeleteSuccess: 'Run deleted'
  },
  RunMessage: {
    Finished: 'Experiment run_id={runId} has finished. You can click "Analyze Result" to continue.',
    Failed: 'Experiment run_id={runId} failed. You can click "Analyze Failure" to inspect it.',
    Canceled: 'Experiment run_id={runId} has been canceled.',
    AnalyzeResultPrompt: 'Please analyze the result of run_id={runId} in the current session and summarize the key findings.',
    AnalyzeFailurePrompt: 'Please analyze why run_id={runId} failed in the current session and suggest debugging steps.'
  },
  Message: {
    Streaming: 'Responding...',
    Error: 'Response error'
  },
  Errors: {
    ListSessions: 'Failed to load session list',
    CreateSession: 'Failed to create session',
    DeleteSession: 'Failed to delete session',
    CancelRun: 'Failed to cancel the run',
    DeleteRun: 'Failed to delete the run',
    LoadHistory: 'Failed to load message history',
    ChatFailed: 'Assistant chat failed',
    MissingUserId: 'Current login data is missing a user identifier. Please sign in again.',
    MissingUserIdSend: 'Current user is missing user_id and cannot send assistant messages',
    UnavailableSession: 'Could not create an available session to send the message',
    EmptyReply: 'No assistant reply was received yet. Please try again later.',
    LoginExpired: 'Login has expired. Please sign in again and retry.',
    ReplyInterrupted: 'Assistant reply was interrupted. Please try again later.'
  }
}
