export interface RegisterOptions {
  username: string
  password: string
  email: string
  code: string
}

export interface RegisterRes {}

export interface SendEmailOptions {
  email: string
  type: 'register' | 'retrieve'
}

export interface SendEmailRes {
  code: string
}
