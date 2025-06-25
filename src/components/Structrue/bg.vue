<template>
  <div class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center blur-2xl">
    <div class="platform-bg w-full h-full max-w-[1000px] max-h-[1000px] blur-2xl" />
  </div>
</template>

<style>
.platform-bg {
  background-image: url('./bg.png');
  z-index: -100;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.1;
}
</style>
