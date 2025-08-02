import { service } from '@/core/madison/utils'

export function checkNS(namespace: string) {
  return service<{ is_exist: boolean }>({
    url: '/monitor/checkns',
    method: 'get',
    params: { namespace }
  })
}
