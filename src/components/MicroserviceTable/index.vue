<script setup lang="ts">
import { Madison } from '@/core/madison'
import item from './item.vue'
import { ref } from 'vue'
import type { Microservice } from '@/core/madison-addon-testbed'
import { message } from '@/utils/utils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const madison = Madison.getInstance()
const microservice = madison.testbed.microservices
const dialogCreateVisible = ref(false)

const microserviceId = ref(-1)
const testbedName = ref('')
const serviceName = ref('')
const desc = ref('')
const services = ref<[string, number][]>([])
const allowReplica = ref(true)

function create(microservice: Microservice) {
  microserviceId.value = microservice.id
  serviceName.value = microservice.name
  testbedName.value = ''
  desc.value = ''
  services.value = microservice.services.map((service) => [service.name, 1])
  allowReplica.value = microservice.allowReplica

  dialogCreateVisible.value = true
}

async function createConfirm() {
  if (testbedName.value === '') {
    message('Please enter a testbed name')
    return
  }
  const useServices = services.value.filter((service) => service[1] !== 1)
  const res = await madison.testbed.createTestbed({
    name: testbedName.value,
    microservice_type: microserviceId.value,
    description: desc.value,
    instance_count: Object.fromEntries(useServices)
  })
  if (res) {
    dialogCreateVisible.value = false
  }
}

</script>

<template>
  <div>
    <div class="gap-4 p-10 grid grid-cols-3 lt:grid-cols-4 dt:grid-cols-5 lg:grid-cols-6">
      <!-- <item
      v-for="m, i in Array(26)"
      :key="i"
      :microservice="microservice[0]"
    /> -->
      <item
        v-for="m, i in microservice"
        :key="i"
        :microservice="m"
        @create="create"
      />
    </div>
    <el-dialog
      v-model="dialogCreateVisible"
      :show-close="false"
      width="500"
    >
      <template #header>
        <div class="text-4xl font-extrabold font-title text-center">
          <span>{{ serviceName }}</span>
        </div>
      </template>
      <div class="flex flex-col gap-4 pl-4 pr-4">
        <span class="text-3xl font-extrabold font-title">{{ t('Microservice.Dialog.TestbedName') }}</span>
        <el-input
          v-model="testbedName"
          placeholder="Please input"
        />
        <span class="text-3xl font-extrabold font-title">{{ t('Microservice.Dialog.Description') }}</span>
        <el-input
          v-model="desc"
          :rows="2"
          type="textarea"
          placeholder="Please input"
        />
        <div
          v-show="allowReplica"
          class="flex flex-col gap-4"
        >
          <span class="text-3xl font-extrabold font-title">{{ t('Microservice.Dialog.Services') }}</span>
          <div
            v-for="item in services"
            :key="item[0]"
            class="flex justify-between items-center text-lg"
          >
            <span>{{ item[0] }}</span>
            <el-input-number
              v-model="item[1]"
              :min="1"
              :max="3"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="pl-4 pr-4 flex gap-2 justify-end">
          <el-button @click="dialogCreateVisible = false">{{ t('Microservice.Dialog.Cancel') }}</el-button>
          <el-button
            type="primary"
            @click="createConfirm"
          >
            {{ t('Microservice.Dialog.Confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
