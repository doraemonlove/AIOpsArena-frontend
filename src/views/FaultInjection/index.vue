<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Structure from '@/components/Structure/index.vue'
import LoongCalendar from '@/components/LoongCalendar/index.vue'
import type { ScheduleRenderData } from '@/components/LoongCalendar'
import { useCalendar } from '@/components/LoongCalendar'
import FaultDialog from '@/components/FaultManager/dialog.vue'
import { useMadison } from '@/core/madison'
import { CalendarFaultsManager } from '@/core/madison-addon-fault-manager/core/fault-history'
import card from './card.vue'
import faultDetail from './fault-detail.vue'

const { t } = useI18n()
const calendar = useCalendar(CalendarFaultsManager.CAL_KEY, {
  grid: {
    timeWidth: 72,
    cellMinWidth: 180,
    dateHeight: 64,
    cells: [
      { range: '1h', displayHeight: 88, maxHeight: 88 }
    ]
  },
  scheduleDisplay: {
    layoutMode: 'block',
    snapMinutes: 60,
    minDurationMinutes: 20,
    durationStepMinutes: 20
  },
  themes: {
    light: {
      backgroundColor: '#ffffff',
      linesColor: 'rgba(148, 163, 184, 0.22)',
      schedule: {
        titleFontFamily: 'Arial',
        contentFontFamily: 'Arial',
        timeFontFamily: 'Arial',
        titleFontSize: 16,
        contentFontSize: 13,
        timeFontSize: 12
      },
      time: {
        fontFamily: 'Arial',
        fontSize: 14,
        color: '#64748b'
      },
      date: {
        fontFamily: 'Arial',
        weekFontSize: 15,
        dateFontSize: 14,
        color: '#334155',
        backgroundColor: '#f8fafc'
      },
      current: {
        fontFamily: 'Arial',
        fontSize: 14,
        color: '#ffffff',
        backgroundColor: '#2563eb',
        size: 6
      },
      scrollbar: {
        thumbColor: '#cbd5e1',
        backgroundColor: '#f1f5f9'
      }
    }
  }
})

const madison = useMadison()
const faultManager = madison.faultManager
const namespaceIsValid = faultManager.calendarFaultsManager.namespaceIsValid
const { selectedFaultName, cascaderOptions } = faultManager
const { namespacesSelected, namespacesSelectedOptions } = faultManager.calendarFaultsManager
const faultTypes = faultManager.faultTypes

const drawerVisible = ref(false)
const displayFault = ref<null | ScheduleRenderData>(null)

const faultCategories = computed(() => {
  const categoriesFromTypes = Array.from(new Set(faultTypes.value.map((item) => item.category).filter(Boolean)))
  if (categoriesFromTypes.length > 0) {
    return categoriesFromTypes.map((item) => ({ label: getCategoryLabel(item), value: item }))
  }
  return cascaderOptions.value.map((item) => ({ label: getCategoryLabel(item.value), value: item.value }))
})
const activeFaultCategory = computed({
  get: () => {
    if (selectedFaultName.value.length > 0) return selectedFaultName.value[0]
    return faultCategories.value[0]?.value || ''
  },
  set: (category: string) => {
    if (!category) {
      selectedFaultName.value = []
      return
    }
    const currentFault = selectedFaultName.value[1]
    const faultExists = faultTypes.value.some((item) => item.category === category && item.name === currentFault)
    selectedFaultName.value = faultExists && currentFault ? [category, currentFault] : [category]
  }
})
const visibleFaults = computed(() => {
  const typedList = faultTypes.value.filter((item) => item.category === activeFaultCategory.value)
  if (typedList.length > 0) return typedList
  const category = cascaderOptions.value.find((item) => item.value === activeFaultCategory.value)
  return (category?.children || []).map((item) => ({
    templateName: item.value,
    name: item.label,
    category: activeFaultCategory.value,
    type: '',
    description: '',
    requiredParams: [],
    targetCandidates: []
  }))
})
const selectedFaultValue = computed(() => selectedFaultName.value[1] || '')
const activeFaultCategoryLabel = computed(() => {
  if (!activeFaultCategory.value) return '--'
  return getCategoryLabel(activeFaultCategory.value)
})
const weekLabel = computed(() => {
  const start = new Date(calendar.manager.renderWeek.value)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const startMonth = `${start.getMonth() + 1}`.padStart(2, '0')
  const endMonth = `${end.getMonth() + 1}`.padStart(2, '0')
  const startDate = `${start.getDate()}`.padStart(2, '0')
  const endDate = `${end.getDate()}`.padStart(2, '0')
  if (startYear === endYear) return `${startYear}.${startMonth}.${startDate} - ${endMonth}.${endDate}`
  return `${startYear}.${startMonth}.${startDate} - ${endYear}.${endMonth}.${endDate}`
})

let hasPositionedCalendarToNow = false

watch(
  faultCategories,
  (categories) => {
    if (categories.length === 0) {
      selectedFaultName.value = []
      return
    }
    const categoryExists = categories.some((item) => item.value === selectedFaultName.value[0])
    if (!categoryExists) selectedFaultName.value = [categories[0].value]
  },
  { immediate: true }
)

function clickFault(event: MouseEvent, fault: ScheduleRenderData) {
  displayFault.value = fault
  drawerVisible.value = true
}

function closeFaultDetail() {
  drawerVisible.value = false
  faultManager.calendarFaultsManager.hideCard()
}

function handleDrawerClosed() {
  displayFault.value = null
}

function selectFault(category: string, fault: string) {
  selectedFaultName.value = [category, fault]
}

function formatFaultName(name: string) {
  return name.replace(/[-_]/g, ' ')
}

function getCategoryLabel(category: string) {
  const normalized = category.toLowerCase()
  const key = `FaultInjection.CategoryOptions.${normalized}`
  const translated = t(key)
  return translated === key ? category : translated
}

function getFaultCardMeta(name: string, category: string) {
  const key = name.toLowerCase()
  if (key.includes('network')) {
    return {
      iconClass: 'text-emerald-600',
      iconWrapClass: 'bg-emerald-100 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]',
      cardClass: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
    }
  }
  if (key.includes('stress') || key.includes('jvm')) {
    return {
      iconClass: 'text-violet-600',
      iconWrapClass: 'bg-violet-100 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.18)]',
      cardClass: 'border-violet-200 bg-violet-50/70 hover:bg-violet-50'
    }
  }
  if (key.includes('io') || key.includes('dns')) {
    return {
      iconClass: 'text-orange-500',
      iconWrapClass: 'bg-orange-100 text-orange-700 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.18)]',
      cardClass: 'border-orange-200 bg-orange-50/70 hover:bg-orange-50'
    }
  }
  if (key.includes('http')) {
    return {
      iconClass: 'text-rose-500',
      iconWrapClass: 'bg-rose-100 text-rose-700 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]',
      cardClass: 'border-rose-200 bg-rose-50/70 hover:bg-rose-50'
    }
  }
  if (category === 'service') {
    return {
      iconClass: 'text-emerald-600',
      iconWrapClass: 'bg-emerald-100 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]',
      cardClass: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
    }
  }
  return {
    iconClass: 'text-blue-600',
    iconWrapClass: 'bg-blue-100 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]',
    cardClass: 'border-blue-200 bg-blue-50/70 hover:bg-blue-50'
  }
}

function getCategoryButtonClass(category: string, isActive: boolean) {
  const normalized = category.toLowerCase()
  if (normalized === 'service') {
    return isActive
      ? 'fault-category-button fault-category-button--active fault-category-button--service'
      : 'fault-category-button fault-category-button--inactive fault-category-button--service-soft'
  }
  if (normalized === 'pod') {
    return isActive
      ? 'fault-category-button fault-category-button--active fault-category-button--pod'
      : 'fault-category-button fault-category-button--inactive fault-category-button--pod-soft'
  }
  return isActive
    ? 'fault-category-button fault-category-button--active'
    : 'fault-category-button fault-category-button--inactive'
}

function getFaultIcon(name: string, category: string) {
  const key = name.toLowerCase()
  if (key.includes('cpu')) return 'Histogram'
  if (key.includes('memory')) return 'Coin'
  if (key.includes('kill')) return 'SwitchButton'
  if (key.includes('exception')) return 'WarningFilled'
  if (key.includes('latency')) return 'Timer'
  if (key.includes('gc')) return 'RefreshRight'
  if (key.includes('network') || key.includes('http')) return 'Connection'
  if (key.includes('dns')) return 'Guide'
  if (key.includes('io')) return 'Operation'
  if (category === 'service') return 'Grid'
  return 'Box'
}

function jumpWeek(offset: number) {
  const nextWeek = new Date(calendar.manager.renderWeek.value)
  nextWeek.setDate(nextWeek.getDate() + offset * 7)
  nextWeek.setHours(0, 0, 0, 0)
  calendar.manager.renderWeek.value = nextWeek
}

function toWeekStart(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function jumpToCurrentWeek() {
  calendar.manager.type.value = 'week'
  calendar.manager.renderWeek.value = toWeekStart(new Date())
}

function positionCalendarToNow(force = false) {
  if (hasPositionedCalendarToNow && !force) return
  const renderer = calendar.renderer
  const viewHeight = renderer.canvasHeight - renderer.dayRenderer.height - renderer.scrollbarRenderer.size
  if (viewHeight <= 0) return

  const secondsSinceMidnight =
    new Date().getHours() * 3600 +
    new Date().getMinutes() * 60 +
    new Date().getSeconds()

  const calendarHeight =
    renderer.gridLineRenderer.linesAmount[0] *
    renderer.gridLineRenderer.minHeight *
    renderer.yScale

  const targetYOffset = Math.round(viewHeight * 0.42 - (secondsSinceMidnight / 86400) * calendarHeight)
  renderer.updateOffset(0, targetYOffset, false, true)
  hasPositionedCalendarToNow = true
}

function handleCanvasOnline() {
  requestAnimationFrame(() => {
    positionCalendarToNow()
  })
}

calendar.on('schedule-mouse-click', clickFault)
calendar.on('canvas-online', handleCanvasOnline)

onMounted(() => {
  calendar.manager.type.value = 'week'
  calendar.manager.renderWeek.value = toWeekStart(calendar.manager.renderWeek.value || new Date())
  handleCanvasOnline()
})

onBeforeUnmount(() => {
  calendar.off('schedule-mouse-click', clickFault)
  calendar.off('canvas-online', handleCanvasOnline)
  hasPositionedCalendarToNow = false
})
</script>

<template>
  <Structure :main-full="true">
    <template #main>
      <div class="relative h-full w-full overflow-hidden bg-slate-100/70 p-4">
        <FaultDialog />
        <div class="flex h-full min-h-0 w-full">
          <aside
            class="flex h-full flex-none flex-col overflow-hidden pr-4"
            style="width:20vw;min-width:20vw;max-width:20vw;flex-basis:20vw;"
          >
            <div class="rounded-[28px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div class="mb-3 text-sm font-semibold tracking-[0.12em] text-slate-400">
                {{ t('FaultInjection.Namespace') }}
              </div>
              <el-select
                v-model="namespacesSelected"
                class="w-full"
                size="large"
              >
                <el-option
                  v-for="item in namespacesSelectedOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>

            <div class="fault-side-divider mt-4">
              <span>{{ t('FaultInjection.SelectFault') }}</span>
            </div>

            <div class="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div class="mb-4 flex items-center justify-between">
                <div class="text-lg font-semibold text-slate-900">
                  {{ t('FaultInjection.FaultLibrary') }}
                </div>
                <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {{ activeFaultCategoryLabel }}
                </div>
              </div>

              <div class="fault-section-heading">
                <span>{{ t('FaultInjection.FaultCategory') }}</span>
              </div>
              <div class="mb-5">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="category in faultCategories"
                    :key="category.value"
                    :class="getCategoryButtonClass(category.value, category.value === activeFaultCategory)"
                    @click="activeFaultCategory = category.value"
                  >
                    {{ category.label }}
                  </button>
                </div>
              </div>

              <div class="fault-section-heading mb-4">
                <span>{{ t('FaultInjection.AvailableFaults') }}</span>
              </div>
              <div class="fault-card-grid min-h-0 flex-1 overflow-y-auto pr-1">
                <button
                  v-for="fault in visibleFaults"
                  :key="fault.templateName"
                  class="fault-card-item fault-icon-card flex min-h-[144px] flex-col items-center justify-center rounded-3xl border px-5 py-5 text-center transition-all"
                  :class="fault.name === selectedFaultValue
                    ? 'border-blue-500 bg-blue-500 text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)]'
                    : `${getFaultCardMeta(fault.name, activeFaultCategory).cardClass} text-slate-800 hover:-translate-y-0.5`"
                  @click="selectFault(activeFaultCategory, fault.name)"
                >
                  <div
                    class="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] transition-all"
                    :class="fault.name === selectedFaultValue ? 'bg-white/16 text-white' : getFaultCardMeta(fault.name, activeFaultCategory).iconWrapClass"
                  >
                    <el-icon
                      :size="30"
                      :class="fault.name === selectedFaultValue ? 'text-white' : getFaultCardMeta(fault.name, activeFaultCategory).iconClass"
                    >
                      <component :is="getFaultIcon(fault.name, activeFaultCategory)" />
                    </el-icon>
                  </div>
                  <div class="min-w-0">
                    <div class="line-clamp-2 text-base font-semibold leading-6">
                      {{ formatFaultName(fault.name) }}
                    </div>
                  </div>
                </button>
                <el-empty
                  v-if="visibleFaults.length === 0"
                  class="w-full"
                  :description="t('FaultInjection.NoFaultsInCategory')"
                />
              </div>
            </div>
          </aside>

          <div
            class="min-h-0 overflow-hidden rounded-[32px] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
            style="width:80vw;min-width:80vw;max-width:80vw;flex-basis:80vw;"
          >
            <div class="relative h-full">
              <LoongCalendar
                :id="CalendarFaultsManager.CAL_KEY"
                :destory="false"
              >
                <template #headerLeft>
                  <div class="flex items-center gap-3">
                    <div class="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                      {{ t('FaultInjection.WeekView') }}
                    </div>
                    <div class="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                      <el-button
                        text
                        class="!h-9 !w-9 !rounded-full"
                        @click="jumpWeek(-1)"
                      >
                        ←
                      </el-button>
                      <div class="min-w-[220px] px-3 text-center">
                        <div class="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {{ t('FaultInjection.ThisWeek') }}
                        </div>
                        <div class="text-base font-semibold text-slate-900">
                          {{ weekLabel }}
                        </div>
                      </div>
                      <el-button
                        text
                        class="!h-9 !w-9 !rounded-full"
                        @click="jumpWeek(1)"
                      >
                        →
                      </el-button>
                    </div>
                    <el-button
                      round
                      @click="jumpToCurrentWeek"
                    >
                      {{ t('FaultInjection.ThisWeek') }}
                    </el-button>
                  </div>
                </template>
                <template #canvasCenter>
                  <div class="relative flex h-full w-full items-center justify-center">
                    <card />
                  </div>
                </template>
              </LoongCalendar>
            </div>
          </div>
        </div>
        <div
          v-if="!namespaceIsValid"
          class="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-white/75 backdrop-blur-[2px]"
        >
          <p class="text-center text-4xl font-bold leading-[48px] text-pink-500">
            {{ t('FaultInjection.PleaseSelectANamespace.PLSGoto') }}
            <router-link
              class="text-moonlight-500"
              to="testbed"
            >
              {{ t('FaultInjection.PleaseSelectANamespace.Testbed') }}
            </router-link>
            <br>
            {{ t('FaultInjection.PleaseSelectANamespace.LastS') }}
          </p>
        </div>
        <el-drawer
          v-model="drawerVisible"
          :title="t('FaultInjection.DetailDialog.FaultDetail')"
          direction="rtl"
          :size="500"
          @closed="handleDrawerClosed"
        >
          <faultDetail
            v-if="displayFault"
            :key="displayFault.id"
            :fault="displayFault"
            @close="closeFaultDetail"
          />
        </el-drawer>
      </div>
    </template>
  </Structure>
</template>

<style scoped>
.fault-side-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.fault-side-divider::before,
.fault-side-divider::after,
.fault-section-heading::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.7), rgba(148, 163, 184, 0.18));
}

.fault-section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.fault-card-grid {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px 8px;
  gap: 12px 0;
  box-sizing: border-box;
}

.fault-card-item {
  width: 42%;
  min-width: 42%;
  max-width: 42%;
}

.fault-icon-card:hover {
  box-shadow: 0 18px 36px rgba(148, 163, 184, 0.16);
}

.fault-category-button {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid transparent;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.fault-category-button::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.fault-category-button:hover {
  transform: translateY(-1px);
}

.fault-category-button--active {
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.fault-category-button--inactive {
  border-style: dashed;
  background: #fff;
  color: #64748b;
  opacity: 0.78;
}

.fault-category-button--inactive::after {
  opacity: 1;
}

.fault-category-button--inactive:hover {
  opacity: 1;
}

.fault-category-button--service {
  border-color: rgba(16, 185, 129, 0.28);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(236, 253, 245, 0.95));
  color: #047857;
}

.fault-category-button--service-soft {
  border-color: rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.98), rgba(236, 253, 245, 0.92));
  color: #047857;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08);
}

.fault-category-button--service-soft::after {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(255, 255, 255, 0));
}

.fault-category-button--pod {
  border-color: rgba(59, 130, 246, 0.28);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(239, 246, 255, 0.96));
  color: #1d4ed8;
}

.fault-category-button--pod-soft {
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.92));
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.08);
}

.fault-category-button--pod-soft::after {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0));
}

@media (max-width: 1500px) {
  .fault-card-item {
    width: 42%;
    min-width: 42%;
    max-width: 42%;
  }
}

@media (max-width: 1280px) {
  .fault-card-grid {
    padding: 0 0 8px;
  }

  .fault-card-item {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
}
</style>
