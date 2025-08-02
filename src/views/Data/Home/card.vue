<script setup lang="ts">
import { useMadison } from '@/core/madison'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title: string
  disc: string
  icon: string
  to: string
  needNamespace: boolean
}>()

const { t } = useI18n()
const madison = useMadison()
const namespace = madison.namespace.queryNamespace
</script>

<template>
  <div class="card-li">
    <div class="card border dark:border-white/20">
      <div class="card__id-container">
        <div class="card__id">
          <span>
            {{ icon }}
          </span>
        </div>
      </div>
      <h3>
        {{ title }}
      </h3>
      <p>
        {{ disc }}
      </p>
      <router-link
        :to="{ name: to, query: { namespace: needNamespace ? namespace : undefined }}"
        class="card__bottom-button border-t dark:border-white/20 text-moonlight-500 hover:text-white hover:bg-moonlight-500"
      >
        {{ t('Data.Home.ViewDetails') }}
      </router-link>
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
