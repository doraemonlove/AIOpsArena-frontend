import { service } from '@/core/madison/utils'
import type { CreateLoadOptions, CreateLoadRes, DeleteLoadOptions, GetDeleteResultRes, GetInstallResultRes, GetLoadInfoRes, GetParamsOptions, GetParamsRes } from '../types'

export function createLoad(options: CreateLoadOptions) {
  return service<CreateLoadRes>({
    url: '/load/create',
    method: 'post',
    data: options
  })
}

export function getInstallResult(loadId: number) {
  return service<GetInstallResultRes>({
    url: '/load/getinstallresult',
    method: 'get',
    params: {
      load_id: loadId
    }
  })
}

export function deleteLoad(options: DeleteLoadOptions) {
  return service<null>({
    url: '/load/delete',
    method: 'get',
    params: {
      load_id: options.loadId
    }
  })
}

export function getDeleteResult(loadId: number) {
  return service<GetDeleteResultRes>({
    url: '/load/getdeleteresult',
    method: 'get',
    params: {
      load_id: loadId
    }
  })
}

export function getLoadParams(options: GetParamsOptions) {
  return service<GetParamsRes>({
    url: '/load/getparams',
    method: 'get',
    params: {
      ...options,
      microservice_type_id: options.microserviceTypeId
    }
  })
}

export function getLoadInfo(loadId: number) {
  return service<[GetLoadInfoRes]>({
    url: '/load/get',
    method: 'get',
    params: {
      load_id: loadId
    }
  })
}
