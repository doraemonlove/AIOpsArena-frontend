export * from './events'

export type MadisonLangs = 'zh-CN' | 'en-US'

export interface MadisonApiRes<D> {
  code: number
  message: string
  data: D
}

export enum MadisonDataQueryTaskStatus {
  READY = 'READY',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  DISTORY = 'DISTORY'
}
