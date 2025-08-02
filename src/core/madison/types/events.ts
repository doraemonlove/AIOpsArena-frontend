import type { MadisonTheme } from '@/core/madison-addon-theme'
import type { RouteLocationRaw } from 'vue-router'

export type RouterPromiseSyncFuncRes = void | ['success'] | ['redirect', RouteLocationRaw]

export interface MadisonEvents {
  logout: []
  'theme-change': [MadisonTheme]
}
