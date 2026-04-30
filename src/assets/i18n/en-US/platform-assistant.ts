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
  Message: {
    Streaming: 'Responding...',
    Error: 'Response error'
  },
  Errors: {
    ListSessions: 'Failed to load session list',
    CreateSession: 'Failed to create session',
    DeleteSession: 'Failed to delete session',
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
