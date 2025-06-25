<script setup lang="ts">
import { CalendarSchedule, useCalendar, destoryCalendar } from './index.ts'
import { onBeforeUnmount, onMounted } from 'vue'
import controller from './controller.vue'

const props = defineProps({
  id: {
    type: String,
    default: 'myCanvas'
  },
  destory: {
    type: Boolean,
    default: true
  }
})

const calendar = useCalendar(props.id)
const schedule1 = new CalendarSchedule(new Date('2025-05-28 00:00:00'), new Date('2025-05-28 01:00:00'), '日程一', 'something to do', 0, '1', {})
const schedule2 = new CalendarSchedule(new Date('2025-05-28 00:30:00'), new Date('2025-05-28 01:50:00'), '日程二', 'something to do', 1, '2', {})
const schedule3 = new CalendarSchedule(new Date('2025-05-28 00:40:00'), new Date('2025-05-28 01:40:00'), '日程三', 'something to do', 2, '3', {})
const schedule4 = new CalendarSchedule(new Date('2025-05-28 00:50:00'), new Date('2025-05-28 01:50:00'), '日程四', 'something to do', 3, '4', {})
const schedule5 = new CalendarSchedule(new Date('2025-05-28 01:00:00'), new Date('2025-05-28 03:00:00'), '日程五', 'something to do', 4, '5', {})
const schedule6 = new CalendarSchedule(new Date('2025-05-28 01:50:00'), new Date('2025-05-28 02:50:00'), '日程六', 'something to do', 5, '6', {})
const schedule7 = new CalendarSchedule(new Date('2025-05-28 03:00:00'), new Date('2025-05-28 04:00:00'), '日程七', 'something to do', 6, '7', {})

calendar.manager.addSchedule(schedule1)
calendar.manager.addSchedule(schedule2)
calendar.manager.addSchedule(schedule3)
calendar.manager.addSchedule(schedule4)
calendar.manager.addSchedule(schedule5)
calendar.manager.addSchedule(schedule6)
calendar.manager.addSchedule(schedule7)

onMounted(() => {
  // calendar.manager.type.value = 'date'
})

onBeforeUnmount(() => {
  if (props.destory) destoryCalendar(props.id)
})
</script>

<template>
  <div class="w-full h-full">
    <div style="height: 60px;">
      <controller :id="id">
        <template #headerCenter>
          <slot name="headerCenter" />
        </template>
        <template #headerRightHead>
          <slot name="headerRightHead" />
        </template>
        <template #headerRightTail>
          <slot name="headerRightTail" />
        </template>
      </controller>
    </div>
    <div
      class="relative"
      style="height: calc(100% - 60px);"
    >
      <canvas
        :id="id"
        class="w-full h-full"
        width="1000"
        height="1000"
        style="cursor: grabbing;"
      />
      <div class="absolute top-0 left-0 select-none pointer-events-none w-full h-full overflow-hidden">
        <slot name="canvasCenter" />
      </div>
    </div>
  </div>
</template>
