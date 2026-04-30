<script setup lang="ts">
import Structure from '@/components/Structure/index.vue'
import MicroserviceTable from '@/components/MicroserviceTable/index.vue'
import TestbedTable from '@/components/TestbedTable/index.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <Structure>
    <template #main>
      <div class="h-full overflow-auto bg-slate-100/70 p-4">
        <div class="flex min-h-full flex-col gap-4">
          <section class="h-[40%] min-h-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex h-full flex-col">
              <div class="border-b border-slate-200 px-6 py-4">
                <h2 class="text-lg font-semibold text-slate-900">{{ t('Testbed.Page.MicroserviceTitle') }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ t('Testbed.Page.MicroserviceDescription') }}</p>
              </div>
              <div class="min-h-0 flex-1 overflow-auto">
                <MicroserviceTable />
              </div>
            </div>
          </section>

          <section class="h-[40%] min-h-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex h-full flex-col">
              <div class="border-b border-slate-200 px-6 py-4">
                <h2 class="text-lg font-semibold text-slate-900">{{ t('Testbed.Page.TestbedTitle') }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ t('Testbed.Page.TestbedDescription') }}</p>
              </div>
              <div class="min-h-0 flex-1 overflow-auto px-2 pb-2">
                <TestbedTable />
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </Structure>
</template>
