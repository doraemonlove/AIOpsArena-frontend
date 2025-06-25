export interface LoginOptions {
  type: 'username' | 'email'
  key: string
  password: string
}

export interface LoginRes {
  token: string
}

export enum LoginState {
  READY,
  LOGGED,
  FAILURE,
  LOGOUT
}

export interface RetrieveOptions {
  email: string
  code: string
  password: string
}
