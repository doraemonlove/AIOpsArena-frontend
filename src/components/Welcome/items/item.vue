<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  }
})

</script>

<template>
  <div class="w-full">
    <div class=" bg-moonlight-100/30 dark:bg-moonlight-950/10  pt-4 pb-4">
      <div class="m-auto max-w-[1200px] flex flex-col gap-4">
        <div class="text-5xl">
          <span>{{ title }}</span>
        </div>
        <p>
          <slot name="content" />
        </p>
        <div>
          <router-link
            :to="path"
            class="inline-flex gap-1 items-center bg-darker-fill dark:bg-darker-fill-dark p-1 pr-3 pl-3 rounded-[50px] hover:text-moonlight-500"
          >
            <span>了解更多</span>
            <el-icon size="14">
              <ArrowRightBold />
            </el-icon>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
