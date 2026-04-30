<template>
  <div class="w-full h-screen flex justify-center items-center platform-arena-title">
    <div>
      <div class="text-9xl select-none">
        <span class="text-moonlight-500">AI</span>
        <span>Ops </span>
        <router-link
          class="relative inline-block"
          :to="{ name: 'testbed' }"
        >
          <span>Arena</span>
          <div class="platform-arena" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<style>
.platform-arena-title {
  background: linear-gradient(90deg, rgba(255, 255, 255, .05) 1px, transparent 1px), linear-gradient(rgba(255, 255, 255, .05) 1px, transparent 1px);
  background-size: 40px 40px;
}
.platform-arena {
  transition: all 0.3s;
  display: inline-block;
  position: absolute;
  border-radius: 30px;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -10;
}
a:has(.platform-arena):hover .platform-arena {
  transition: all 0.3s;
  background-color: #FF87C880;
  filter: blur(40px);
}
</style>
