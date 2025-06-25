import { serviceNoToken } from '@/core/madison/utils'
import type { RegisterOptions, RegisterRes, SendEmailOptions, SendEmailRes } from '../types'

export function register(options: RegisterOptions) {
  return serviceNoToken<RegisterRes>({
    url: '/register',
    method: 'post',
    data: options
  })
}

export function sendEmail(options: SendEmailOptions) {
  return serviceNoToken<SendEmailRes>({
    url: '/sendEmail',
    method: 'post',
    data: {
      email: options.email,
      send_type: options.type
    }
  })
}
