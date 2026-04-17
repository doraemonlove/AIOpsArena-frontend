import CryptoJS from 'crypto-js'

const AES_KEY = 'a1b2c3d4e5f6g7h8'
/**
 * 随机生成指定数量的16进制key
 * @param {int} num key长度
 * @returns key
 */
const generateKey = (num: number): string => {
  const library = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = ''
  for (let i = 0; i < num * 16; i++) {
    const randomPoz = Math.floor(Math.random() * library.length)
    key += library.substring(randomPoz, randomPoz + 1)
  }
  return key
}

/**
 * 加密
 * @param {string} word 需要加密的字符串
 * @param {string} keyStr key
 * @returns
 */
const encrypt = (word: string, keyStr?: string): string => {
  keyStr = keyStr || AES_KEY // 判断是否存在ksy，不存在就用定义好的key
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const srcs = CryptoJS.enc.Utf8.parse(word)
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}
/**
 * 解密
 * @param {string} word 需要解密的字符串
 * @param {string} keyStr key
 * @returns
 */
const decrypt = (word: string, keyStr?: string): string => {
  keyStr = keyStr || AES_KEY
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const decrypt = CryptoJS.AES.decrypt(word, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return CryptoJS.enc.Utf8.stringify(decrypt).toString()
}

export default {
  generateKey,
  encrypt,
  decrypt
}
