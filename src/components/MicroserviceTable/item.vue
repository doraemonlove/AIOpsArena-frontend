<script setup lang="ts">
import { Microservice } from '@/core/madison-addon-testbed'
import { Madison } from '@/core/madison'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  microservice: {
    type: Microservice,
    required: true
  }
})
const emits = defineEmits<{
  create: [microservice: Microservice]
}>()

const { t } = useI18n()
const microservice = props.microservice
const madison = Madison.getInstance()
const canCreate = madison.testbed.canCreate

console.log(canCreate.value, madison.testbed.maxTestbeds.value, madison.testbed.usedTestbeds.value)

function create() {
  emits('create', microservice)
}

</script>

<template>
  <div class="card-li">
    <div class="card border dark:border-white/20">
      <div class="card__id-container">
        <div class="card__id">
          <span>
            ICON
          </span>
        </div>
      </div>
      <h3>
        {{ microservice.name }}
      </h3>
      <p>
        {{ microservice.name }}
      </p>
      <div
        class="card__bottom-button border-t dark:border-white/20 text-moonlight-500 hover:text-white hover:bg-moonlight-500"
        :class="{ '!cursor-not-allowed !text-gray-500 hover:bg-transparent': !canCreate}"
        @click="create"
      >
        {{ t('Microservice.Deploy') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-li:hover>div {
  transition: all 0.2s linear;
  transform: translateY(-10px);
}

.card {
  position: relative;
  transition: all 0.2s linear;
  width: 230px;
  height: 350px;
  margin: 50px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  line-height: auto;
  flex-direction: column;
  padding: 15px;
}

.card__id-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.card__id {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Exo-SemiBold";
  font-size: 90px;
  width: 130px;
  height: 130px;
  border-radius: 100%;
}

.card__bottom-button {
  user-select: none;
  cursor: pointer;
  width: 100%;
  position: absolute;
  height: 50px;
  line-height: 50px;
  bottom: 0;
  transition: all 0.2s linear;
  border-radius: 0px 0px 5px 5px;
  text-align: center;
}
.card__bottom-button:hover {
  transition: all 0.2s linear;
}
</style>
