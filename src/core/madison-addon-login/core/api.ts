import { serviceNoToken } from '@/core/madison/utils'
import type { LoginOptions, LoginRes, RetrieveOptions } from '../types'

export function loginByUsername(options: LoginOptions) {
  return serviceNoToken<LoginRes>({
    url: '/loginByUsername',
    method: 'post',
    data: {
      username: options.key,
      password: options.password
    }
  })
}

export function loginByEmail(options: LoginOptions) {
  return serviceNoToken<LoginRes>({
    url: '/loginByEmail',
    method: 'post',
    data: {
      email: options.key,
      password: options.password
    }
  })
}

export function retrieve(options: RetrieveOptions) {
  return serviceNoToken<null>({
    url: '/retrieve',
    method: 'post',
    data: options
  })
}
