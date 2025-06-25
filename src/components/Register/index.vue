<script setup lang="ts">
import titleInput from '../Input/titleInput.vue'
import { ref } from 'vue'
import { Madison } from '@/core/madison'
import { message } from '@/utils/utils'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const email = ref('')
const code = ref('')
const madison = Madison.getInstance()
const registerLoading = ref(false)

async function sendEmail() {
  if (!email.value) {
    message('Please enter your email')
    return
  }
  const res = await madison.register.sendEmail({
    email: email.value,
    type: 'register'
  })
}

async function register() {
  if (!username.value || !password.value || !passwordConfirm.value || !email.value || !code.value) {
    message('Please fill in all the fields')
    return
  }
  if (password.value !== passwordConfirm.value) {
    message('Password does not match')
  }
  if (registerLoading.value) return
  registerLoading.value = true
  const res = await madison.register.register({
    username: username.value,
    password: password.value,
    email: email.value,
    code: code.value
  })
  if (res) {
    router.push({ name: 'home' })
  } else {
    registerLoading.value = false
  }
}

</script>

<template>
  <div>
    <div class="flex flex-col gap-2 items-center w-52">
      <span class="text-2xl font-bold"> Register </span>
      <title-input
        v-model="username"
        full
      >Username</title-input>
      <title-input
        v-model="email"
        full
        type="email"
      >Email</title-input>
      <title-input
        v-model="password"
        full
        type="password"
        show-password
      >Password</title-input>
      <title-input
        v-model="passwordConfirm"
        full
        type="password"
        show-password
      >Confirm password</title-input>
      <title-input
        v-model="code"
        full
        append
      >Code
        <template #append>
          <el-button @click="sendEmail">Send</el-button>
        </template>
      </title-input>
      <div class="w-full flex justify-between">
        <span>
          <el-button>
            <router-link :to="{ name: 'login' }">To Login</router-link>
          </el-button>
        </span>
        <span>
          <el-button
            :loading="registerLoading"
            @click="register"
          >Register</el-button>
        </span>
      </div>
    </div>
  </div>
</template>
