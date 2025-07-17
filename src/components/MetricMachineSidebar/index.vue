<script setup lang="ts">
import { Madison } from '@/core/madison'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import s2e from './s2e.vue'

const firstIn = ref(true)
setTimeout(() => {
  firstIn.value = false
}, 1000)
const route = useRoute()
const madison = Madison.getInstance()
const machine = madison.metric.machine
const namesapce = machine.namespace
const type = machine.type
const disable = machine.isCreatingQueryTask
const selectedMetricName = machine.selectedMetricName
const nodeOrPodList = machine.nodeOrPodList

const metricNameMachine = computed(() => {
  const ins =  madison.metric.getMetricName(namesapce.value)
  if (ins) return ins.machine
  return null
})
const metricName = computed(() => {
  if (metricNameMachine.value) {
    return metricNameMachine.value[type.value]
  }
  return null
})
const metricNameData = computed(() => {
  if (metricName.value) {
    return metricName.value.data
  }
  return []
})

const show = ref(false)

function getMetricNameStr(metricName: string, path: string) {
  if (path !== '') {
    if (selectedMetricName.value.has(metricName)) {
      const i = path.indexOf(metricName)
      return path.slice(0, i) + path.slice(i + metricName.length)
    } else {
      return path + ',' + metricName
    }
  } else {
    if (selectedMetricName.value.has(metricName)) {
      return ''
    } else {
      return metricName
    }
  }
}

function addAll(metricName: string[], path: string) {
  const set = new Set()
  metricName.forEach((mn) => {
    if (path.indexOf(mn) === -1) {
      set.add(mn)
    }
  })
  const add = Array.from(set.values()).join(',')
  return path + ',' + add
}

function removeAll(metricName: string[], path: string) {
  const set = new Set(path.split(','))
  metricName.forEach((mn) => {
    if (path.indexOf(mn) !== -1) {
      set.delete(mn)
    }
  })
  return Array.from(set).join(',')
}

function addAllAll() {
  const list: string[] = []
  metricNameData.value.forEach((mnd) => {
    mnd.metricName.forEach((mn) => {
      list.push(mn)
    })
  })
  return list.join(',')
}

</script>

<template>
  <div
    class="fixed top-1/2 -translate-y-1/2 cursor-pointer platform-mms-pointer z-10 "
    @click="show = !show"
  >
    <div
      class="absolute opacity-[0.8] w-40 h-40 top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 blur-[60px] -z-10 rounded-full pointer-events-none"
      :class="{'!bg-[#FF87C8]': firstIn}"
    />
    <div class="bg-light-fill dark:bg-light-fill-dark rounded-r-md pt-6 pb-6 pl-[2px] pr-[2px] text-[#FF87C8]  border-t border-r border-b border-light-border dark:border-light-border-dark">
      <el-icon>
        <ArrowRightBold />
      </el-icon>
    </div>
    <el-drawer
      v-model="show"
      direction="ltr"
      append-to-body
      :lock-scroll="false"
      :show-close="false"
      :with-header="false"
      size="450"
      body-class="!p-3"
    >
      <div class="flex flex-col gap-4">
        <div>
          <span class="text-lg">
            Selected type: {{ type }}
          </span>
        </div>
        <div>
          <el-popover
            placement="right"
            :width="400"
            trigger="hover"
          >
            <template #reference>
              <div class="w-full cursor-pointer flex justify-between pt-2 pb-2 items-center hover:text-moonlight-500">
                <span class="text-lg">
                  Change {{ type }}
                </span>
                <el-icon>
                  <ArrowRightBold />
                </el-icon>
              </div>
            </template>
            <div
              class="flex flex-col gap-2 text-lg"
              style="max-height: calc(100vh - 50px); overflow: auto;"
            >
              <router-link
                v-for="l in nodeOrPodList"
                :key="l.name"
                class="hover:underline flex justify-between items-center hover:text-moonlight-500"
                :class="{'text-moonlight-500': l.name === (l.type === 'node' ? route.query.node : route.query.pod)}"
                :to="l.getRoute(route)"
              >
                <span>{{ l.name }}</span>
                <span v-show="l.name === (l.type === 'node' ? route.query.node : route.query.pod)">Now</span>
              </router-link>
            </div>
          </el-popover>
        </div>
        <div>
          <span class="text-lg">
            Select time interval
          </span>
        </div>
        <s2e
          :manager="machine"
          :query="true"
          size="small"
        />
        <div>
          <span class="text-lg">
            Select metric name
          </span>
        </div>
        <div>
          <div class="flex justify-between items-center">
            <router-link
              class="hover:underline flex justify-between items-center text-moonlight-500"
              :to="{ name: route.name, query: {
                ...route.query,
                metricName: addAllAll()
              }}"
            >
              Add all
            </router-link>
            <router-link
              class="hover:underline flex justify-between items-center text-danger"
              :to="{ name: route.name, query: {
                ...route.query,
                metricName: ''
              }}"
            >
              Remove all
            </router-link>
          </div>
          <el-popover
            v-for="mnd in metricNameData"
            :key="mnd.name"
            placement="right"
            :width="600"
            trigger="hover"
          >
            <template #reference>
              <div class="w-full cursor-pointer flex justify-between pt-2 pb-2 items-center hover:text-moonlight-500">
                <span class="text-xl">{{ mnd.name }}</span>
                <el-icon>
                  <ArrowRightBold />
                </el-icon>
              </div>
            </template>
            <div
              class="flex flex-col gap-2 text-lg"
              style="max-height: calc(100vh - 50px); overflow: auto;"
            >
              <div class="flex justify-between items-center">
                <router-link
                  class="hover:underline flex justify-between items-center text-moonlight-500"
                  :to="{ name: route.name, query: {
                    ...route.query,
                    metricName: addAll(mnd.metricName, route.query.metricName as string || '')
                  }}"
                >
                  Add all
                </router-link>
                <span>
                  {{ mnd.name }}
                </span>
                <router-link
                  class="hover:underline flex justify-between items-center text-danger"
                  :to="{ name: route.name, query: {
                    ...route.query,
                    metricName: removeAll(mnd.metricName, route.query.metricName as string || '')
                  }}"
                >
                  Remove all
                </router-link>
              </div>
              <router-link
                v-for="mn in mnd.metricName"
                :key="mn"
                class="hover:underline flex justify-between items-center"
                :class="{ 'hover:text-danger': selectedMetricName.has(mn), 'hover:text-moonlight-500': !selectedMetricName.has(mn) }"
                :to="{ name: route.name, query: {
                  ...route.query,
                  metricName: getMetricNameStr(mn, route.query.metricName as string || '')}}"
              >
                <span>{{ mn }}</span>
                <span>{{ selectedMetricName.has(mn) ? 'Remove' : 'Add' }}</span>
              </router-link>
            </div>
          </el-popover>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style>
.platform-mms-select > .el-select__wrapper {
  border-radius: 0px;
}

.platform-mms-pointer > .absolute {
  transition: all 0.6s;
  background-color: #FF87C800;
}
.platform-mms-pointer:hover > .absolute {
  transition: all 0.6s;
  background-color: #FF87C8;
}
</style>
