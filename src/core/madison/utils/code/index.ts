import CryptoJS from './CryptoJS'
import MD5 from './MD5'
import Base64 from './Base64'
import RSA from './RSA'

export default {
  CryptoJS,
  MD5,
  Base64,
  RSA
}

/**
 * 示例:
 * import Code from "@/assets/js/code/code.js";
 * 根据默认key无损加密字符串：abcd >> Code.CryptoJS.encrypt("abcd");
 * 根据自定义key无损加密字符串：abcd >> Code.CryptoJS.encrypt("abcd", "this is a key");
 * 随机生成一个长度是16的key值 >> key = Code.CryptoJS.generateKey(16);
 * 根据默认key解密无损加密的字符串 en_str >> Code.CryptoJS.decrypt(en_str);
 * 根据自定义key解密无损加密的字符串 en_str >> Code.CryptoJS.decrypt(en_str, "this is a key");
 *
 * 用md5有损加密字符串：abcde >> Code.MD5.encrypt("abcde");
 */
