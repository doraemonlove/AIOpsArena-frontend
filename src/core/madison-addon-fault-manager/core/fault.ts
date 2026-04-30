import type { FaultParam, FaultParamField, FaultParamOption, ParamsMapValue } from '../types'
import { h, defineComponent, type Ref, ref, type WritableComputedRef } from 'vue'
import { ElInputNumber, ElOption, ElSelect, ElInput, ElSwitch, ElRadioGroup, ElRadioButton, ElDatePicker } from 'element-plus'
import { injectExperiment, injectSchedule } from './api'
import type { FaultManager } from '.'
import { getDate0000 } from '@/components/LoongCalendar'

export class FaultDetail {
  static readonly EL_COMPONENTS_WIDTH = '600px'
  templateName: string
  name: string
  category: string
  type: string
  description: string

  private __faultIns: FaultManager

  private __params: Record<
    string,
    FaultParamField
  >
  private __paramsMap: Map<string, ParamsMapValue> = new Map()

  private __auxData: {
    namespaces: string[]
    podList: string[]
    namespace: string
  }

  private __type: Ref<'experiment' | 'schedule'> = ref('experiment')
  private __schedule: Ref<string> = ref('')
  private __clockTime: Ref<'' | Date> = ref('')
  private t: any

  constructor(faultIns: FaultManager, data: FaultParam, auxData: { namespaces: string[]; podList: string[], namespace: string }) {
    this.__faultIns = faultIns
    this.t = faultIns.t
    this.templateName = data.templateName || data.name
    this.category = data.category
    this.description = data.description
    this.name = data.name
    this.type = data.type
    this.__params = data.params
    this.__auxData = auxData

    this.createParamsMap()
  }

  applyFaultParam(data: FaultParam) {
    this.templateName = data.templateName || data.name
    this.category = data.category
    this.description = data.description
    this.name = data.name
    this.type = data.type
    this.__params = data.params
    this.createParamsMap()
    this.paramsInit()
  }

  private createController(
    header: string,
    components: ReturnType<typeof this.createControllerRow>[],
    style?: Record<string, string>
  ) {
    return defineComponent({
      name: 'MadisonDetailFaultController',
      setup() {
        return () => {
          return h(
            'div',
            { class: 'flex flex-col gap-4', style: style },
            {
              default: () => {
                return [
                  h('div', {
                    innerHTML: header
                  }),
                  ...components.map((component) => h(component))
                ]
              }
            }
          )
        }
      }
    })
  }

  private createControllerRow(
    name: string,
    prompt: string,
    component:
      | ReturnType<typeof FaultDetail.prototype.createElInput>
      | ReturnType<typeof FaultDetail.prototype.createElInputNumber>
      | ReturnType<typeof FaultDetail.prototype.createElSelectMultiple>
      | ReturnType<typeof FaultDetail.prototype.createElSelect>
      | ReturnType<typeof FaultDetail.prototype.createElSwitch>
      | ReturnType<typeof FaultDetail.prototype.createElSwitchBoolean>
  ) {
    return defineComponent({
      name: 'MadisonDetailFaultControllerRow',
      setup() {
        return () => {
          return h(
            'div',
            { class: 'flex flex-col w-full' },
            {
              default: () => {
                return [
                  h(
                    'div',
                    {
                      class: 'flex gap-2 items-center justify-between'
                    },
                    {
                      default: () => {
                        return [
                          h('span', {
                            class: 'text-lg font-blod',
                            innerHTML: name
                          }),
                          h(component)
                        ]
                      }
                    }
                  ),
                  h('div', {
                    class: 'p-2',
                    innerHTML: prompt
                  })
                ]
              }
            }
          )
        }
      }
    })
  }

  private createElInput(content: Ref<string>, placeholder?: string) {
    return defineComponent({
      name: 'MadisonDetailFaultElInput',
      setup() {
        return () => {
          return h(ElInput, {
            modelValue: content.value,
            placeholder: placeholder,
            'onUpdate:modelValue': (value: string) => {
              content.value = value
            },
            style: {
              width: FaultDetail.EL_COMPONENTS_WIDTH
            }
          })
        }
      }
    })
  }

  private createElInputNumber(content: Ref<number>, placeholder?: string) {
    return defineComponent({
      name: 'MadisonDetailFaultElInputNumber',
      setup() {
        return () => {
          return h(ElInputNumber, {
            modelValue: content.value,
            placeholder: placeholder,
            min: 1,
            'onUpdate:modelValue': (value: number | undefined) => {
              content.value = value || 1
            },
            style: {
              width: FaultDetail.EL_COMPONENTS_WIDTH
            }
          })
        }
      }
    })
  }

  private createElSwitchBoolean(content: Ref<boolean>) {
    return defineComponent({
      name: 'MadisonDetailFaultElSwitchBoolean',
      setup() {
        return () => {
          return h(ElSwitch, {
            modelValue: content.value,
            'onUpdate:modelValue': (value: string | number | boolean) => {
              content.value = Boolean(value)
            }
          })
        }
      }
    })
  }

  private createElSelectMultiple(
    content: Ref<string[]>,
    options: { label: string; value: string }[]
  ) {
    return defineComponent({
      name: 'MadisonDetailFaultElSelectMultiple',
      setup() {
        return () => {
          return h(
            ElSelect,
            {
              modelValue: content.value,
              'onUpdate:modelValue': (newVal) => {
                content.value = newVal
              },
              placeholder: 'Select',
              multiple: true,
              style: {
                width: FaultDetail.EL_COMPONENTS_WIDTH
              }
            },
            {
              default: () => {
                return options.map((item: any) =>
                  h(ElOption, {
                    key: item.value,
                    label: item.label,
                    value: item.value
                  })
                )
              }
            }
          )
        }
      }
    })
  }

  private createElSelect(content: Ref<string>, options: { label: string; value: string }[]) {
    return defineComponent({
      name: 'MadisonDetailFaultElSelect',
      setup() {
        return () => {
          return h(
            ElSelect,
            {
              modelValue: content.value,
              'onUpdate:modelValue': (newVal) => {
                content.value = newVal
              },
              placeholder: 'Select',
              style: {
                width: FaultDetail.EL_COMPONENTS_WIDTH
              }
            },
            {
              default: () => {
                return options.map((item: any) =>
                  h(ElOption, {
                    key: item.value,
                    label: item.label,
                    value: item.value
                  })
                )
              }
            }
          )
        }
      }
    })
  }

  private createElSwitch(content: Ref<boolean>, active: string, inactive: string) {
    return defineComponent({
      name: 'MadisonDetailFaultElSwitch',
      setup() {
        return () => {
          return h(ElSwitch, {
            modelValue: content.value,
            'onUpdate:modelValue': (value: string | number | boolean) => {
              if (value === active) content.value = true
              else if (value === inactive) content.value = false
              else if (typeof value === 'string') content.value = value !== ''
              else if (typeof value === 'number') content.value = value === 1
              else content.value = value
            },
            style: {
              width: FaultDetail.EL_COMPONENTS_WIDTH
            }
          })
        }
      }
    })
  }

  private createElDateTimePicker(content: Ref<Date | ''>, disabledDate?: (date: Date) => boolean) {
    const t = this.t
    return defineComponent({
      setup() {
        return () => h(ElDatePicker, {
          modelValue: content.value,
          type: 'datetime',
          placeholder: t('FaultInjection.InjectionDialog.SelectInjectionTiming'),
          'onUpdate:modelValue': (value: Date | null) => {
            if (value === null) content.value = new Date()
            else content.value = value
          },
          disabledDate,
          style: {
            width: FaultDetail.EL_COMPONENTS_WIDTH
          }
        })
      }
    })
  }

  private createElRadioGroup(content: Ref<string> | WritableComputedRef<string>, labels: string[]) {
    return defineComponent({
      name: 'MadisonDetailFaultElRadioGroup',
      setup() {
        return () => {
          return h(ElRadioGroup, {
            modelValue: content.value,
            'onUpdate:modelValue': (value: string | number | boolean | undefined) => {
              content.value = value?.toString() || ''
            }
          }, {
            default: () => {
              return labels.map((item: string) =>
                h(ElRadioButton, {
                  value: item,
                  label: item
                })
              )
            }
          })
        }
      }
    })
  }

  private createESSwitch() {
    const t = this.t
    const radioGroup = this.createElRadioGroup(this.__type, ['experiment', 'schedule'])
    const experimentComponent = this.createElDateTimePicker(this.__clockTime, (date: Date) => date < getDate0000(new Date()))
    const scheduleComponent = this.createElInput(this.__schedule)
    const experimentComponentCol = this.createControllerRow(t('FaultInjection.InjectionDialog.Experiment'), t('FaultInjection.InjectionDialog.Single'), experimentComponent)
    const scheduleComponentCol = this.createControllerRow(t('FaultInjection.InjectionDialog.Schedule'), t('FaultInjection.InjectionDialog.Timer'), scheduleComponent)
    const type = this.__type
    return defineComponent({
      name: 'MadisonDetailFaultESSwitch',
      setup() {
        return () => {
          return h('div', {
            class: 'flex flex-col gap-4 items-center'
          }, {
            default: () => {
              return [
                h(radioGroup),
                type.value === 'experiment' ? h(experimentComponentCol) : h(scheduleComponentCol)
              ]
            }
          })
        }
      }
    })
  }

  /**
   * 创建参数映射表
   */
  private createParamsMap() {
    this.__paramsMap.clear()
    for (const key in this.__params) {
      const param = this.__params[key]
      let mapV: ParamsMapValue
      if (key === 'namespace' && param.type === 'string') {
        // namespace不允许用户在注入的时候进行选择
        // mapV = {
        //   type: param.type,
        //   description: param.description,
        //   name: key,
        //   component: 'el-select',
        //   value: ref(''),
        //   meta: {},
        //   options: this.__auxData.namespaces.map((item) => ({
        //     label: item,
        //     value: item
        //   }))
        // }
        continue
      } else if (key === 'targetpods' && param.type === 'array') {
        const defaultValue = this.normalizeArrayValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-select-multiple',
          value: ref(defaultValue),
          meta: {
            defaultValue
          },
          options: this.hasFieldOptions(param)
            ? this.resolveFieldOptions(param)
            : this.__auxData.podList.map((item) => ({
              label: item,
              value: item
            }))
        }
      } else if (key === 'pods' && param.type === 'array') {
        const defaultValue = this.normalizeArrayValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-select-multiple',
          value: ref(defaultValue),
          meta: {
            defaultValue
          },
          options: this.hasFieldOptions(param)
            ? this.resolveFieldOptions(param)
            : this.__auxData.podList.map((item) => ({
              label: item,
              value: item
            }))
        }
      } else if (param.type === 'boolean') {
        mapV = {
          type: 'boolean',
          description: param.description,
          name: key,
          component: 'el-switch',
          value: ref(Boolean(param.defaultValue ?? false)),
          meta: {
            defaultValue: Boolean(param.defaultValue ?? false)
          }
        }
      } else if (param.type === 'array' && this.hasFieldOptions(param)) {
        const defaultValue = this.normalizeArrayValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-select-multiple',
          value: ref(defaultValue),
          meta: {
            defaultValue
          },
          options: this.resolveFieldOptions(param)
        }
      } else if (param.type === 'string' && this.hasFieldOptions(param)) {
        const defaultValue = this.normalizeStringValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-select',
          value: ref(defaultValue),
          meta: {
            defaultValue
          },
          options: this.resolveFieldOptions(param)
        }
      } else if (param.type === 'string') {
        const defaultValue = this.normalizeStringValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-input',
          value: ref(defaultValue),
          meta: {
            defaultValue
          }
        }
      } else if (param.type === 'number') {
        const defaultValue = this.normalizeNumberValue(param.defaultValue)
        mapV = {
          type: param.type,
          description: param.description,
          name: key,
          component: 'el-input-number',
          value: ref(defaultValue),
          meta: {
            defaultValue
          }
        }
      } else {
        console.warn(`Unsupported: ${key} ${param.type}`)
        continue
      }
      this.__paramsMap.set(key, mapV)
    }
  }

  private hasFieldOptions(param: FaultParamField) {
    return Array.isArray(param.options) && param.options.length > 0
  }

  private resolveFieldOptions(param: FaultParamField): FaultParamOption[] {
    return (param.options || []).map((item) => ({
      label: item.label,
      value: String(item.value)
    }))
  }

  private normalizeStringValue(value: FaultParamField['defaultValue']) {
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return ''
  }

  private normalizeNumberValue(value: FaultParamField['defaultValue']) {
    if (typeof value === 'number' && value > 0) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed) && parsed > 0) return parsed
    }
    return 1
  }

  private normalizeArrayValue(value: FaultParamField['defaultValue']) {
    if (Array.isArray(value)) return value.map((item) => String(item))
    return []
  }

  /**
   * 参数初始化
   */
  paramsInit() {
    Array.from(this.__paramsMap.values()).forEach((item) => {
      if (item.component === 'el-input' || item.component === 'el-select') {
        item.value.value = (item.meta.defaultValue as string | undefined) || ''
      } else if (item.component === 'el-input-number') {
        item.value.value = (item.meta.defaultValue as number | undefined) || 1
      } else if (item.component === 'el-select-multiple') {
        item.value.value = Array.isArray(item.meta.defaultValue) ? [...item.meta.defaultValue] : []
      } else if (item.component === 'el-switch') {
        item.value.value = Boolean(item.meta.defaultValue)
      }
    })
    this.__type.value = 'experiment'
    this.__clockTime.value = ''
    this.__schedule.value = ''
  }

  /**
   * 获取本故障需要填写的vue组件
   * @returns
   */
  getFaultInjectComponent(): ReturnType<typeof this.createController> {
    const components = Array.from(this.__paramsMap.values())
      .map((item) => {
        if (item.component === 'el-input') {
          return [item, this.createElInput(item.value, item.description)]
        } else if (item.component === 'el-input-number') {
          return [item, this.createElInputNumber(item.value, item.description)]
        } else if (item.component === 'el-select-multiple') {
          return [item, this.createElSelectMultiple(item.value, item.options)]
        } else if (item.component === 'el-select') {
          return [item, this.createElSelect(item.value, item.options)]
        } else if (item.component === 'el-switch') {
          return [item, this.createElSwitchBoolean(item.value)]
        } else return undefined
      })
      .filter((item) => item !== undefined) as [
      ParamsMapValue,
      (
        | ReturnType<typeof FaultDetail.prototype.createElInput>
        | ReturnType<typeof FaultDetail.prototype.createElInputNumber>
        | ReturnType<typeof FaultDetail.prototype.createElSelectMultiple>
        | ReturnType<typeof FaultDetail.prototype.createElSelect>
        | ReturnType<typeof FaultDetail.prototype.createElSwitch>
        | ReturnType<typeof FaultDetail.prototype.createElSwitchBoolean>
      )
    ][]
    const row = components.map((component) => {
      return this.createControllerRow(component[0].name, component[0].description, component[1])
    })
    row.unshift(this.createESSwitch())
    const header = `<div class='text-center font-blod text-2xl pb-4'>${this.name}<div/>`
    return this.createController(header, row)
  }

  async confirm(): Promise<[boolean, string]> {
    const t = this.__faultIns.t
    const values = Array.from(this.__paramsMap.values())
    const params: any = {}
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      if (typeof value.value.value === 'string') {
        if (!value.value.value) return [false, `${value.name} ${t('Madison.FaultManager.Dialog.Empty')}`]
      } else if (typeof value.value.value === 'number') {
        if (!value.value.value || value.value.value < 1) return [false, `${value.name} ${t('Madison.FaultManager.Dialog.Empty')}`]
      } else if (Array.isArray(value.value.value)) {
        if (value.value.value.length === 0) return [false, `${value.name} ${t('Madison.FaultManager.Dialog.Empty')}`]
      }
      params[value.name] = value.value.value
    }
    params['namespace'] = this.__auxData.namespace
    if (this.__type.value === 'experiment' && this.__clockTime.value === '') return [false, `clockTime ${t('Madison.FaultManager.Dialog.Empty')}`]
    if (this.__type.value === 'schedule' && this.__schedule.value === '') return [false, `schedule ${t('Madison.FaultManager.Dialog.Empty')}`]
    if (this.__type.value === 'experiment') {
      const clockTime = Math.floor((this.__clockTime.value as Date).getTime() / 1000).toString()
      if (parseInt(clockTime) < Date.now() / 1000) return [false, `clockTime ${t('Madison.FaultManager.Dialog.LessThanNow')}`]
      const options = {
        templateName: this.templateName,
        faultType: this.type,
        clockTime,
        params: params
      }
      try {
        const res = await injectExperiment(options)
        if (res.data.code === 1) {
          this.__faultIns.messageI18n('FaultManager.Inject.Failure')
          return [false, res.data.message]
        }
      } catch (e) {
        return [false, 'Error']
      }
      const checkDate = new Date(this.__clockTime.value as Date)
      this.__faultIns.calendarFaultsManager.refresh(getDate0000(checkDate))
      this.paramsInit()
      this.__faultIns.messageI18n('FaultManager.Inject.Success', 'success')
      return [true, '']
    }
    if (this.__type.value === 'schedule') {
      const options = {
        templateName: this.templateName,
        faultType: this.type,
        schedule: this.__schedule.value,
        params: params
      }
      try {
        const res = await injectSchedule(options)
        if (res.data.code === 1) {
          this.__faultIns.messageI18n('FaultManager.Inject.Failure')
          return [false, res.data.message]
        }
      } catch (e) {
        return [false, 'Error']
      }
      this.paramsInit()
      this.__faultIns.calendarFaultsManager.refresh(true)
      this.__faultIns.messageI18n('FaultManager.Inject.Success', 'success')
      return [true, '']
    }
    return [false, 'Type error']
  }
}
