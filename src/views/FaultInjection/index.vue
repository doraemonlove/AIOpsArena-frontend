<script setup lang="ts">
import Structure from '@/components/Structrue/index.vue'
import LoongCalendar from '@/components/LoongCalendar/index.vue'
import { CalendarFaultsManager } from '@/core/madison-addon-fault-manager/core/fault-history'
import FaultCalendarPrompt from '@/components/FaultCalendarPrompt/index.vue'
import FaultManager from '@/components/FaultManager/index.vue'
import card from './card.vue'
import { useMadison } from '@/core/madison'
import type { ScheduleRenderData } from '@/components/LoongCalendar'
import { LoongSchedule, useCalendar } from '@/components/LoongCalendar'
import { onBeforeUnmount, ref } from 'vue'
import faultDetail from './fault-detail.vue'

const calendar = useCalendar(CalendarFaultsManager.CAL_KEY)
const madison = useMadison()
const faultManager = madison.faultManager
const currentRenderDataLoaded = faultManager.calendarFaultsManager.currentRenderDataLoaded
const namespaceIsValid = faultManager.calendarFaultsManager.namespaceIsValid

// const schedule1 = new LoongSchedule(calendar, '1', '日程一', 'something to do', 0, '03:00:00', '05:00:00', '* * * *', {})
// const schedule2 = new LoongSchedule(calendar, '2', '日程二', 'something to do', 1, '03:00:00', '05:00:00', '2-15 6 1,2,0 *', {})
// const schedule3 = new LoongSchedule(calendar, '3', '日程三', 'something to do', 2, '03:00:00', '05:00:00', '2-15 6 1,2,0 *', {})
// const schedule4 = new LoongSchedule(calendar, '4', '日程四', 'something to do', 3, '03:00:00', '05:00:00', '2-15 6 1,2,0 *', {})
// const schedule5 = new LoongSchedule(calendar, '5', '日程五', 'something to do', 4, '03:00:00', '05:00:00', '2-15 6 1,2,0 *', {})

calendar.on('schedule-mouse-click', clickFault)

const drawerVisible = ref(false)
const displayFault = ref<null | ScheduleRenderData>(null)

function clickFault(event: MouseEvent, fault: ScheduleRenderData) {
  console.log(fault)
  displayFault.value = fault
  drawerVisible.value = true
}

onBeforeUnmount(() => {
  calendar.off('schedule-mouse-click', clickFault)
})
</script>

<template>
  <Structure :main-full="true">
    <template #main>
      <div class="w-full h-full overflow-x-hidden relative">
        <!-- <FaultManager /> -->
        <div class="relative h-full">
          <LoongCalendar
            :id="CalendarFaultsManager.CAL_KEY"
            :destory="false"
          >
            <template #headerCenter>
              <div class="flex gap-2 items-center">
                <FaultManager />
                <FaultCalendarPrompt />
              </div>
            </template>
            <template #canvasCenter>
              <div
                class="relative flex justify-center items-center w-full h-full"
              >
                <card />
                <span
                  v-if="!namespaceIsValid"
                  class="text-pink-500 text-6xl font-bold"
                >Please select a namespace</span>
              </div>
            </template>
          </LoongCalendar>
        </div>
        <el-drawer
          v-model="drawerVisible"
          title="Fault Detail"
          direction="rtl"
          :size="500"
        >
          <faultDetail
            :key="displayFault === null ? 'unknown' : displayFault.id"
            :fault="(displayFault as ScheduleRenderData)"
          />
        </el-drawer>
      </div>
    </template>
  </Structure>
</template>
