import JSEncrypt from 'jsencrypt'
import { RSA_PUBLIC_KEY } from './config'

/**
 * RSA加密
 * @param publicKey 公钥
 * @param plainText 明文
 * @returns {*} 密文
 */
function encrypt(plainText: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(RSA_PUBLIC_KEY)
  return encryptor.encrypt(plainText)
}

export default {
  encrypt
}
