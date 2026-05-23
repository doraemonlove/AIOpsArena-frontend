<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import links from './links.vue'
import theme from './theme.vue'
import lang from './lang.vue'
import { useI18n } from 'vue-i18n'
import unauthAvatar from '@/assets/weidenglu.svg'

import { Madison } from '@/core/madison'
const router = useRouter()
const { t } = useI18n()
const loginManager = Madison.getInstance().login
const logged = loginManager.logged

const avatarModules = import.meta.glob('@/assets/image/animal/*.svg', {
  eager: true,
  import: 'default'
}) as Record<string, string>

const avatarOptions = Object.values(avatarModules)

function getStableAvatar(source: string) {
  if (avatarOptions.length === 0) return ''
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return avatarOptions[hash % avatarOptions.length] || ''
}

const displayName = computed(() => {
  if (!logged.value) return '未登录'
  return loginManager.displayName || 'User'
})

function logout() {
  const res = loginManager.logout()
  if (res) router.push({ name: 'login' })
}

function toLogin() {
  router.push({ name: 'login' })
}

const currentAvatar = computed(() => {
  if (!logged.value) return unauthAvatar
  return getStableAvatar(displayName.value || 'User')
})
</script>

<template>
  <div class="w-full h-16 flex items-center justify-center pr-6 pl-6 border-b dark:border-white/20 backdrop-blur-lg bg-bg/30 dark:bg-bg-dark/30">
    <div class="flex items-center justify-between w-full max-w-[1200px] h-full">
      <div class="flex items-center gap-4 h-full">
        <links />
      </div>
      <div class="flex items-center gap-4 select-none">
        <lang />
        <theme />
        <el-popover
          trigger="click"
          placement="bottom-end"
          :width="240"
          popper-class="header-user-popover"
        >
          <template #reference>
            <button class="header-user-trigger">
              <div class="header-user-trigger__avatar">
                <img
                  :src="currentAvatar"
                  alt="User avatar"
                  class="h-full w-full object-cover"
                >
              </div>
            </button>
          </template>

          <div class="header-user-panel">
            <div class="header-user-panel__identity">
              <div class="header-user-panel__avatar">
                <img
                  :src="currentAvatar"
                  alt="User avatar"
                  class="h-full w-full object-cover"
                >
              </div>
              <div class="min-w-0">
                <div class="truncate text-lg font-semibold text-slate-900">
                  {{ displayName }}
                </div>
              </div>
            </div>
            <button
              class="header-user-panel__action"
              @click="logged ? logout() : toLogin()"
            >
              <el-icon class="text-slate-500">
                <SwitchButton />
              </el-icon>
              <span>{{ logged ? t('Nav.SignOut') : t('Nav.SignIn') }}</span>
            </button>
          </div>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-user-trigger {
  display: flex;
  align-items: center;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.9);
  padding: 4px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.header-user-trigger:hover {
  border-color: rgb(203 213 225);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.header-user-trigger__avatar {
  display: flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: linear-gradient(135deg, #fffbeb, #ffffff, #e0f2fe);
  box-shadow: inset 0 0 0 2px rgb(241 245 249);
  flex: 0 0 40px;
}

.header-user-panel {
  padding: 6px 4px 2px;
}

.header-user-panel__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px 14px;
  border-bottom: 1px solid rgb(226 232 240);
}

.header-user-panel__avatar {
  display: flex;
  height: 52px;
  width: 52px;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: linear-gradient(135deg, #fffbeb, #ffffff, #e0f2fe);
  box-shadow: inset 0 0 0 2px rgb(241 245 249);
}

.header-user-panel__action {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  padding: 12px 10px;
  margin-top: 8px;
  color: rgb(30 41 59);
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.header-user-panel__action:hover {
  background: rgb(248 250 252);
  color: rgb(15 23 42);
}
</style>
