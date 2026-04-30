import { MadisonAddon } from '@/core/madison/core/addon-base'
import { CalendarFaultsManager, CalendarFaultsRenderManager } from './fault-history'
import type { Madison } from '@/core/madison/core'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { RouterPromiseSyncFuncRes } from '@/core/madison/types'
import { deleteFault, getFaultSchema, getFaultTypes } from './api'
import { getPodlist } from '@/core/madison-addon-metric/core/api'
import type { FaultParam, FaultParamField, FaultSchema, FaultSchemaParam, FaultTypeListItem } from '../types'
import { FaultDetail } from './fault'
import { computed, ref, type ComputedRef, type Ref } from 'vue'

export class FaultManager extends MadisonAddon {
  private __dataIsGotten = false

  readonly calendarFaultsManager: CalendarFaultsManager

  private __podListMap: Map<string, string[]> = new Map()

  // Map<namespace, Map<cayegory, Map<name, FaultDetail>>>
  private __faultsData: Map<string, Map<string, Map<string, FaultDetail>>> = new Map()

  private __namespace: Ref<string> = ref('')
  private __faultTypes: Ref<FaultTypeListItem[]> = ref([])
  private __faultSchemaMap: Map<string, FaultSchema | null> = new Map()

  selectedFaultName: Ref<string[]> = ref([])

  readonly faultTypes: ComputedRef<FaultTypeListItem[]> = computed(() => {
    return this.__faultTypes.value
  })

  readonly cascaderOptions: ComputedRef<
    {
      label: string
      value: string
      children: {
        label: string
        value: string
      }[]
    }[]
  > = computed(() => {
      const namespace = this.__namespace.value
      const grouped = new Map<string, string[]>()
      this.__faultTypes.value.forEach((item) => {
        const current = grouped.get(item.category) || []
        if (!current.includes(item.name)) current.push(item.name)
        grouped.set(item.category, current)
      })

      const faults = this.__faultsData.get(namespace) || new Map<string, Map<string, FaultDetail>>()
      Array.from(faults.entries()).forEach(([key, value]) => {
        const current = grouped.get(key) || []
        Array.from(value.keys()).forEach((name) => {
          if (!current.includes(name)) current.push(name)
        })
        grouped.set(key, current)
      })

      return Array.from(grouped.entries()).map(([key, value]) => {
        return {
          label: key,
          value: key,
          children: value.map((item) => {
            return {
              label: item,
              value: item
            }
          })
        }
      })
    })

  readonly selectedFaultIns: ComputedRef<FaultDetail | null> = computed(() => {
    const namespace = this.__namespace.value
    const path = this.selectedFaultName.value
    if (
      namespace === '' ||
      namespace === CalendarFaultsRenderManager.CAL_DEF_NAMESPACE ||
      path.length < 2
    ) { return null }
    const category = path[0]
    const name = path[1]
    const faultIns = this.ensureFaultDetail(namespace, category, name)
    return faultIns || null
  })

  readonly t: any

  constructor(madison: Madison) {
    super(madison)

    this.t = madison.i18n.getT()

    this.calendarFaultsManager = new CalendarFaultsManager(madison, this)

    madison.routerPromise.addPrecheck(this.precheck, this)
    madison.routerPromise.addCheck(this.check, this)
    madison.routerPromise.addCheck(this.checkNeedNamespace, this)
    madison.routerPromise.addPostcheck(this.postcheck, this)
  }

  private precheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {}

  private async check(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    if (this.__dataIsGotten) return
    const can = await this.defNoNSCheck(to, from, 'faultinjection')
    if (!can) return
    this.__dataIsGotten = true
  }

  private async checkNeedNamespace(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<RouteLocationRaw | void> {
    const can = await this.defNoNSCheck(to, from, 'faultinjection')
    if (!can) return
    /** 检查namespace */
    await this.__madison.namespace.waitingForQueryNamespaceCheck
    const nv = this.__madison.namespace.queryNamespaceIsValid
    if (!nv) {
      /** namespace错误，查看有没有可用的namespace */
      await this.__madison.namespace.waitingForNamespaceGet
      if (this.__madison.namespace.namespaces.value.length === 0) {
        /** 没有namespace可用 */
        return
      }
      return { name: 'faultinjection', query: { ...to.query, namespace: this.__madison.namespace.namespaces.value[0] }}
    }
    const namespace = this.__madison.namespace.queryQueryNamespace.value
    if (!this.__faultsData.has(namespace)) this.__faultsData.set(namespace, new Map())
    const promises = [this.loadPodList(namespace)]
    await this.__madison.namespace.waitingForNamespaceGet
    await Promise.allSettled(promises)

    await this.loadFaultTypes(namespace)
    this.checkPodFaults(namespace)
  }

  private postcheck(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): RouterPromiseSyncFuncRes {
    this.__namespace.value = to.query.namespace as string
    return
  }

  private checkPodFaults(namespace: string) {
    const faultsMap = this.__faultsData.get(namespace) as Map<string, Map<string, FaultDetail>>
    if (!faultsMap.has('pod')) faultsMap.set('pod', new Map())
    const podFaultsMap = faultsMap.get('pod') as Map<string, FaultDetail>
    const podList = this.__podListMap.get(namespace)
    if (!podList) {
      console.warn(`podList is null ${namespace}`)
      return
    }
    const podFaults = this.__faultTypes.value.filter((v) => v.category === 'pod')
    podFaults.forEach((fault) => {
      if (podFaultsMap.has(fault.name)) return
      podFaultsMap.set(
        fault.name,
        new FaultDetail(this, {
          templateName: fault.templateName || fault.name,
          name: fault.name,
          category: fault.category,
          type: fault.type,
          description: fault.description || '',
          params: {}
        }, {
          namespaces: this.__madison.namespace.namespaces.value,
          podList,
          namespace
        })
      )
    })
  }

  private async loadPodList(namespace: string) {
    if (this.__podListMap.has(namespace)) return
    const res = await getPodlist({ namespace })
    const data = res.data
    if (data.code === 0) {
      const list = data.data
      this.__podListMap.set(namespace, list)
    }
  }

  private normalizeAssistantField(
    name: string,
    field?: FaultSchemaParam,
    fallback?: FaultParamField
  ): FaultParamField {
    const optionSource = field?.candidates || field?.options || field?.enum_values || field?.special_values || []
    const normalizedOptions = optionSource
      .map((option) => {
        if (typeof option === 'object') {
          const rawValue = option.value ?? option.name ?? option.label
          if (rawValue === undefined || rawValue === null) return null
          return {
            label: String(option.label ?? option.name ?? rawValue),
            value: String(rawValue)
          }
        }
        return {
          label: String(option),
          value: String(option)
        }
      })
      .filter((item): item is { label: string; value: string } => item !== null)

    return {
      type: field?.type || fallback?.type || 'string',
      description: field?.description || fallback?.description || name,
      required: field?.required,
      defaultValue: field?.default_value ?? fallback?.defaultValue,
      example: field?.example ?? fallback?.example,
      options: normalizedOptions.length > 0 ? normalizedOptions : fallback?.options,
      enumValues: field?.enum_values ?? fallback?.enumValues,
      specialValues: field?.special_values ?? fallback?.specialValues
    }
  }

  private resolveTargetPodCandidates(namespace: string, targetCandidates: string[]) {
    const podList = this.__podListMap.get(namespace) || []
    if (targetCandidates.length === 0) return podList

    const matchedPods = podList.filter((pod) =>
      targetCandidates.some((candidate) => pod.includes(candidate))
    )

    if (matchedPods.length > 0) return matchedPods
    return targetCandidates
  }

  private getMicroserviceNameByNamespace(namespace: string) {
    const testbed = this.__madison.testbed.testbeds.value.find((item) => item.namespace === namespace)
    return testbed?.microservice || ''
  }

  private buildMergedFaultParam(
    namespace: string,
    templateName: string,
    category: string,
    name: string,
    schema?: FaultSchema | null
  ): FaultParam {
    const faultType = this.__faultTypes.value.find((item) =>
      item.templateName === templateName || (item.category === category && item.name === name)
    )
    const params: Record<string, FaultParamField> = {}
    const schemaParams = schema?.params || {}

    Object.entries(schemaParams).forEach(([key, value]) => {
      params[key] = this.normalizeAssistantField(key, value, params[key])
    })

    const requiredParams = schema?.required_params || faultType?.requiredParams || []
    requiredParams.forEach((key) => {
      if (!params[key]) {
        params[key] = {
          type: key === 'targetpods' || key === 'pods' ? 'array' : 'string',
          description: key,
          required: true
        }
      } else {
        params[key].required = true
      }
    })

    const targetCandidates = schema?.target_candidates || faultType?.targetCandidates || []
    ;['targetpods', 'pods'].forEach((key) => {
      const field = params[key]
      if (!field) return
      const podCandidates = this.resolveTargetPodCandidates(namespace, targetCandidates)
      if (podCandidates.length > 0) {
        field.options = podCandidates.map((item) => ({
          label: item,
          value: item
        }))
      } else if (!field.options || field.options.length === 0) {
        const podList = this.__podListMap.get(namespace) || []
        field.options = podList.map((item) => ({
          label: item,
          value: item
        }))
      }
      if (field.type !== 'array') field.type = 'array'
    })

    return {
      templateName,
      name: schema?.name || faultType?.name || name,
      category: schema?.category || faultType?.category || category,
      type: schema?.type || faultType?.type || '',
      description: schema?.description || faultType?.description || '',
      params
    }
  }

  private ensureFaultDetail(namespace: string, category: string, name: string) {
    const faultsMap = this.__faultsData.get(namespace) || new Map<string, Map<string, FaultDetail>>()
    if (!this.__faultsData.has(namespace)) this.__faultsData.set(namespace, faultsMap)
    const categoryMap = faultsMap.get(category) || new Map<string, FaultDetail>()
    if (!faultsMap.has(category)) faultsMap.set(category, categoryMap)

    const cached = categoryMap.get(name)
    if (cached) return cached

    const faultType = this.__faultTypes.value.find((item) => item.category === category && item.name === name)
    const templateName = faultType?.templateName || name

    const detail = new FaultDetail(this, this.buildMergedFaultParam(namespace, templateName, category, name), {
      namespaces: this.__madison.namespace.namespaces.value,
      podList: this.__podListMap.get(namespace) || [],
      namespace
    })
    categoryMap.set(name, detail)
    return detail
  }

  async prepareFaultDetail(detail: FaultDetail) {
    const templateName = detail.templateName
    if (!templateName) return detail

    const namespace = this.__namespace.value
    const microservice = this.getMicroserviceNameByNamespace(namespace)
    const schemaCacheKey = `${templateName}::${microservice}`
    const cachedSchema = this.__faultSchemaMap.get(schemaCacheKey)
    let schema: FaultSchema | null
    if (cachedSchema === undefined) {
      try {
        schema = await getFaultSchema(templateName, microservice)
      } catch (_) {
        schema = null
      }
      this.__faultSchemaMap.set(schemaCacheKey, schema)
    } else {
      schema = cachedSchema
    }

    if (!schema) return detail
    detail.applyFaultParam(
      this.buildMergedFaultParam(namespace, templateName, detail.category, detail.name, schema)
    )
    return detail
  }

  private async loadFaultTypes(namespace: string) {
    try {
      const list = await getFaultTypes()
      if (Array.isArray(list) && list.length > 0) {
        this.__faultTypes.value = list.map((item) => ({
          templateName: item.template_name,
          name: item.name || item.template_name,
          category: item.category,
          type: item.type,
          description: item.description || '',
          requiredParams: item.required_params || [],
          targetCandidates: item.target_candidates || []
        }))
        return
      }
    } catch (_) {}
    this.__faultTypes.value = []
  }

  async deleteFault(faultId: string): Promise<boolean> {
    const res = await deleteFault({ faultId })
    const data = res.data
    if (data.code === 0) {
      this.messageI18n('FaultManager.Delete.Success', 'success')
      this.calendarFaultsManager.refresh(true)
      return true
    }
    this.messageI18n('FaultManager.Delete.Failure')
    return false
  }

  logoutCallback(): void {}
}
