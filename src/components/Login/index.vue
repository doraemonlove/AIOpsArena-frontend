<script setup lang="ts">
import titleInput from '../Input/titleInput.vue'
import { ref } from 'vue'
import { Madison } from '@/core/madison'
import { message } from '@/utils/utils'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginType = ref<'username' | 'email'>('username')
const key = ref('')
const password = ref('')
const madison = Madison.getInstance()
const loginLoading = ref(false)

async function login() {
  if (!key.value || !password.value) {
    message('Please fill in all the fields')
    return
  }
  if (loginLoading.value) return
  loginLoading.value = true
  const res = await madison.login.login({
    type: loginType.value,
    key: key.value,
    password: password.value
  })
  if (res) {
    madison.login.toLoginFromPage()
  } else {
    loginLoading.value = false
  }
}

</script>

<template>
  <div>
    <div class="flex flex-col gap-2 items-center w-52">
      <span class="text-2xl font-bold"> Login </span>
      <el-radio-group v-model="loginType">
        <el-radio-button
          label="Username"
          value="username"
        />
        <el-radio-button
          label="Email"
          value="email"
        />
      </el-radio-group>
      <title-input
        v-model="key"
        :type="loginType === 'username' ? 'text' : 'email'"
        full
      >{{ loginType[0].toLocaleUpperCase() + loginType.slice(1) }}</title-input>
      <title-input
        v-model="password"
        full
        type="password"
        show-password
      >Password</title-input>
      <div class="w-full">
        <router-link
          to="retrieve"
          class="text-sm text-moonlight-500 hover:underline"
        >
          Forgot password?
        </router-link>
      </div>
      <div class="w-full flex justify-between">
        <span>
          <el-button>
            <router-link :to="{ name: 'register' }">To Register</router-link>
          </el-button>
        </span>
        <span>
          <el-button
            :loading="loginLoading"
            @click="login"
          >Login</el-button>
        </span>
      </div>
    </div>
  </div>
</template>
