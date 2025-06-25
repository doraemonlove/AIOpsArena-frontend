<script setup lang="ts">
import { ElDatePicker, ElRadioGroup, ElRadioButton } from 'element-plus'
import { computed, ref } from 'vue'
import { useCalendar } from './index.ts'
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})
const calendar = useCalendar(props.id)
const date = calendar.manager.controllerValue
const type = calendar.manager.type
const format = computed(() => {
  return type.value === 'date' ? 'YYYY-MM-DD' : 'YYYY-[Week]-ww'
})
</script>

<template>
  <div class="w-full h-full flex items-center pl-8 pr-8 box-border justify-between">
    <div class="flex items-center gap-4">
      <div>
        <el-date-picker
          v-model="date"
          :type="type"
          :format="format"
          :editable="false"
          :clearable="false"
        />
      </div>
      <!-- <div>
        显示记录数量{{ calendar.manager.rendererWeek.value[0] }}
        {{ calendar.manager.renderWeek }}
      </div> -->
    </div>
    <div>
      <slot name="headerCenter" />
    </div>
    <div class="flex items-center gap-4">
      <div>
        <slot name="headerRightHead" />
      </div>
      <div>
        <el-radio-group v-model="type">
          <el-radio-button
            label="Date"
            value="date"
          />
          <el-radio-button
            label="Week"
            value="week"
          />
        </el-radio-group>
      </div>
      <div>
        <slot name="headerRightTail" />
      </div>
    </div>
  </div>
</template>
