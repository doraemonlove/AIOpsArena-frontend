import code from './code'
import { localGet, localSet } from './stroage'

export const TOKEN = 'TOKEN'

export function getToken() {
  const token = localGet(TOKEN)
  if (token === null) return ''
  return code.CryptoJS.decrypt(token)
}

export function setToken(token: string) {
  localSet(TOKEN, code.CryptoJS.encrypt(token))
}

export function removeToken() {
  localSet(TOKEN, '')
}
