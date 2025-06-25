import { Base64 } from 'js-base64'

/**
 * base64编码
 * @param word 编码字符串
 * @returns 结果
 */
function encode(word: string): string {
  return Base64.encode(word)
}

/**
 * base64解码
 * @param word 解码字符串
 * @returns 结果
 */
function decode(word: string): string {
  return Base64.decode(word)
}

export default {
  encode,
  decode
}
