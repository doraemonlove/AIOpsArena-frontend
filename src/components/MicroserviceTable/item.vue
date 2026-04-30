<script setup lang="ts">
import { Microservice } from '@/core/madison-addon-testbed'
import { Madison } from '@/core/madison'
import onlineboutiqueImage from '@/assets/image/onlineboutique.png'
import socialnetworkImage from '@/assets/image/socialnetwork.png'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  microservice: Microservice,
  showAction?: boolean,
  actionText?: string
}>(), {
  showAction: false,
  actionText: ''
})
const emits = defineEmits<{
  select: [microservice: Microservice]
}>()

const madison = Madison.getInstance()
const canCreate = madison.testbed.canCreate
const microservice = props.microservice
const microserviceImage = computed(() => {
  const imageMap: Record<string, string> = {
    onlineboutique: onlineboutiqueImage,
    socialnetwork: socialnetworkImage
  }
  return imageMap[microservice.name] || ''
})

function selectMicroservice() {
  if (!props.showAction || !canCreate.value) return
  emits('select', props.microservice)
}
</script>

<template>
  <div class="card-li">
    <button
      class="card border dark:border-white/20"
      :class="{ 'card--action': props.showAction, 'card--disabled': props.showAction && !canCreate }"
      :disabled="props.showAction && !canCreate"
      @click="selectMicroservice"
    >
      <div class="card__media">
        <img
          v-if="microserviceImage"
          :src="microserviceImage"
          :alt="microservice.name"
          class="card__image"
        >
        <div
          v-else
          class="card__fallback"
        >
          {{ microservice.name.slice(0, 1).toUpperCase() }}
        </div>
      </div>
      <div class="card__footer">
        {{ microservice.name }}
      </div>
    </button>
  </div>
</template>

<style scoped>
.card-li:hover>.card {
  transition: all 0.2s linear;
  transform: translateY(-6px);
}

.card-li {
  flex: 0 0 clamp(240px, 18%, 320px);
}

.card {
  transition: all 0.2s linear;
  width: 100%;
  height: 220px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  appearance: none;
  border-width: 1px;
}

.card--action {
  cursor: pointer;
}

.card--action:hover {
  border-color: #93c5fd;
  box-shadow: 0 14px 32px rgba(59, 130, 246, 0.16);
}

.card--disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.card__media {
  display: flex;
  width: 100%;
  height: 80%;
  padding: 18px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
}

.card__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Exo-SemiBold";
  font-size: 72px;
  width: 120px;
  height: 120px;
  border-radius: 24px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 20%;
  padding: 0 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

@media (max-width: 900px) {
  .card-li {
    flex-basis: min(100%, 320px);
  }
}
</style>
