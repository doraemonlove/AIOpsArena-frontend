import type { Madison } from '../madison/core'
import { MadisonAddon } from '../madison/core/addon-base'
import { ref, watch } from 'vue'
import { localGet, localSet } from '../madison/utils'
import { useCalendar } from '@/components/LoongCalendar'
import { CalendarFaultsManager } from '../madison-addon-fault-manager/core/fault-history'

export type MadisonTheme = 'light' | 'dark'

export class Theme extends MadisonAddon {
  static readonly KEY = 'THEME'
  readonly theme = ref<MadisonTheme>('light')

  constructor(madison: Madison) {
    super(madison)

    let t = localGet(Theme.KEY, 'light')
    t = t === 'light' ? 'light' : 'dark'
    localSet('THEME', t)
    this.theme.value = t as MadisonTheme
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
      const calendar = useCalendar(CalendarFaultsManager.CAL_KEY)
      calendar.useTheme('dark')
    }

    watch(this.theme, (newValue) => {
      const calendar = useCalendar(CalendarFaultsManager.CAL_KEY)
      newValue = newValue === 'light' ? 'light' : 'dark'
      if (newValue === 'dark') {
        document.documentElement.classList.add('dark')
        calendar.useTheme('dark')
      } else {
        document.documentElement.classList.remove('dark')
        calendar.useTheme('light')
      }
      localSet(Theme.KEY, newValue)
    })
  }

  toggle() {
    this.theme.value = this.theme.value === 'light' ? 'dark' : 'light'
  }

  logoutCallback(): void {}
}
