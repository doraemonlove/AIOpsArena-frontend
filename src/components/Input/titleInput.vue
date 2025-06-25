<script setup lang="ts">
const model = defineModel({ type: String  })
const props = defineProps({
  full: {
    default: false,
    type: Boolean
  },
  append: {
    default: false,
    type: Boolean
  },
  prepend: {
    default: false,
    type: Boolean
  },
  type: {
    default: 'text',
    type: String
  },
  showPassword: {
    default: false,
    type: Boolean
  }
})
</script>

<template>
  <div
    class="flex flex-col gap-1"
    :class="{ 'w-full flex-shrink-0': props.full}"
  >
    <span class="text-sm">
      <slot />
    </span>
    <el-input
      v-model="model"
      :type="type"
      :show-password="showPassword"
    >
      <template
        v-if="props.prepend"
        #prepend
      >
        <slot name="prepend" />
      </template>
      <template
        v-if="props.append"
        #append
      >
        <slot name="append" />
      </template>
    </el-input>
  </div>
</template>
