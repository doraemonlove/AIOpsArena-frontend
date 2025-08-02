import { service } from '@/core/madison/utils'
import type { GetAlgorithmsRes, GetIndicatorsRes } from '../types'

export function getAlgorithms() {
  return service<GetAlgorithmsRes>({
    url: '/algorithm/fetch',
    method: 'get'
  })
}

export function getIndicators() {
  return service<GetIndicatorsRes>({
    url: '/indicator/fetch',
    method: 'get'
  })
}
