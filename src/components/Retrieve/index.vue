<script setup lang="ts">
import titleInput from '../Input/titleInput.vue'
import { ref } from 'vue'
import { message } from '@/utils/utils'
import { Madison } from '@/core/madison'
import { useRouter } from 'vue-router'

const email = ref('')
const code = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)

const madison = Madison.getInstance()
const router = useRouter()

async function sendEmail() {
  if (!email.value) {
    message('Please enter your email')
    return
  }
  await madison.register.sendEmail({
    email: email.value,
    type: 'retrieve'
  })
}

async function retrieve() {
  if (!password.value || !passwordConfirm.value || !email.value || !code.value) {
    message('Please fill in all the fields')
    return
  }
  if (password.value !== passwordConfirm.value) {
    message('Password does not match')
  }
  const res = await madison.login.retrieve({
    email: email.value,
    code: code.value,
    password: password.value
  })
  if (res) router.push({ name: 'login' })
}

</script>

<template>
  <div>
    <div class="flex flex-col gap-2 items-center w-52">
      <span class="text-2xl font-bold"> Retrieve </span>
      <title-input
        v-model="email"
        full
      >Email</title-input>
      <title-input
        v-model="code"
        full
        append
      >Code
        <template #append>
          <el-button @click="sendEmail">Send</el-button>
        </template>
      </title-input>
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
      <div class="w-full flex justify-between">
        <span>
          <el-button>
            <router-link :to="{ name: 'login' }">To Login</router-link>
          </el-button>
        </span>
        <span>
          <el-button
            :loading="loading"
            @click="retrieve"
          >Retrieve</el-button>
        </span>
      </div>
    </div>
  </div>
</template>
