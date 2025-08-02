import { Madison } from '@/core/madison/core'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { MadisonLangs } from '@/core/madison/types'
import { localSet } from '@/core/madison/utils'
import { localGet } from '@/utils/stroage'
import { ref, watch, type Ref, type WatchHandle } from 'vue'
import { createI18n } from 'vue-i18n'
import type { I18n } from 'vue-i18n'

export class MadisonI18n extends MadisonAddon {
  static LANG = 'LANG'
  static LANG_LIST = ['zh-CN', 'en-US']
  readonly i18n: I18n
  private __lang: Ref<MadisonLangs>
  private __watchFunc: WatchHandle

  constructor(messages: any, madison: Madison) {
    super(madison)
    this.__lang = ref(this.getLangStr())
    this.i18n = createI18n({
      locale: this.__lang.value,
      legacy: false,
      messages: messages
    })
    this.__watchFunc = watch(this.__lang, (newLang: MadisonLangs) => {
      this.setLangStr(newLang)
    })
  }

  logoutCallback(): void {}

  private getLangStr(): MadisonLangs {
    let lang = localGet(MadisonI18n.LANG, 'en-US') || ''
    if (!MadisonI18n.LANG_LIST.includes(lang)) {
      this.setLangStr('en-US')
      lang = 'en-US'
    }
    return lang as MadisonLangs
  }

  private setLangStr(lang: MadisonLangs) {
    localSet(MadisonI18n.LANG, lang)
    this.getLocale().value = lang
  }

  getLang() {
    return this.__lang
  }

  getT() {
    const { t } = this.i18n.global
    return t as any
  }

  getLocale() {
    return this.i18n.global.locale as any
  }

  getTe() {
    const { te } = this.i18n.global
    return te
  }

  toggleLang() {
    this.__lang.value = this.__lang.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  }
}
