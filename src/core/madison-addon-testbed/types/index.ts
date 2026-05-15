export interface MicroserviceItem {
  id: number
  name: string
  path: string
  topology: {
    services: Record<string, { calls: string[] }>
  },
  frontend: string,
  init_command: null,
  loadgenerator: string,
  allow_replica: boolean,
  is_available: boolean
}

export type MicroservicesRes = MicroserviceItem[]

export interface CreateTestbedOptions {
  name: string
  microservice_type: number
  description: string
  instance_count: Record<string, number>
}

export interface CreateTestbedRes {
  testbed_id: number
}

export interface DeleteTestbedOptions {
  testbedId: number
}

export interface TestbedQuotaRes {
  max_testbeds: number
  used_testbeds: number
}

export interface TestbedItem {
  id: number
  name: string
  description: string
  created_person_id: number
  created_time: string
  microservice_type_id: number
  namespace: string
  install_status: string
  install_task_id: string
  delete_status: string
  delete_task_id: string
  topology: {
    services: Record<string, { calls: string[]; instances: number }>
  }
  is_loaded: boolean
  load_id: null | number
}

export type TestbedRes = TestbedItem[]

export interface GetInstallResultOptions {
  testbedId: number
}

export interface GetInstallResultRes {
  status: 'PENDING' | 'STARTED' | 'FAILURE' | 'SUCCESS'
}

export interface GetDeleteResultOptions {
  testbedId: number
}

export interface GetDeleteResultRes {
  status: 'PENDING' | 'STARTED' | 'FAILURE' | 'SUCCESS'
}
