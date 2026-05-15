import { service } from '@/core/madison/utils'
import type { CreateTestbedOptions, MicroservicesRes, TestbedRes, TestbedQuotaRes, DeleteTestbedOptions, CreateTestbedRes, GetInstallResultOptions, GetInstallResultRes, GetDeleteResultOptions, GetDeleteResultRes } from '../types'

export function getTestbed() {
  return service<TestbedRes>({
    url: '/testbed/get',
    method: 'get'
  })
}

export function createTestbed(options: CreateTestbedOptions) {
  return service<CreateTestbedRes>({
    url: '/testbed/create',
    method: 'post',
    data: options
  })
}

export function getTestbedQuota() {
  return service<TestbedQuotaRes>({
    url: '/testbed/quota',
    method: 'get'
  })
}

export function getMicroservices(isAvailable?: boolean) {
  return service<MicroservicesRes>({
    url: '/testbed/microservices',
    method: 'get',
    params: isAvailable === undefined ? undefined : { is_available: isAvailable }
  })
}

export function deleteTestbed(options: DeleteTestbedOptions) {
  return service<null>({
    url: '/testbed/delete',
    method: 'get',
    params: { testbed_id: options.testbedId }
  })
}

export function getInstallRes(options: GetInstallResultOptions) {
  return service<GetInstallResultRes>({
    url: '/testbed/getinstallresult',
    method: 'get',
    params: { testbed_id: options.testbedId }
  })
}

export function getDeleteRes(options: GetDeleteResultOptions) {
  return service<GetDeleteResultRes>({
    url: '/testbed/getdeleteresult',
    method: 'get',
    params: { testbed_id: options.testbedId }
  })
}
