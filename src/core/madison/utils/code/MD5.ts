import { md5 } from 'js-md5'

/**
 * md5加密
 * @param {string} word
 * @returns 经过md5加密的字符串
 */
const encrypt = (word: string): string => {
  return md5(word)
}

export default {
  encrypt
}
