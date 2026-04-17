<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AlgorithmImageStatus, AlgorithmImportStatus, AlgorithmItem } from '@/core/madison-addon-algorithm-manager'
import { useI18n } from 'vue-i18n'
import { localGet } from '@/core/madison/utils'
import { Login } from '@/core/madison-addon-login'

const props = defineProps<{
  title: string
  items: AlgorithmItem[]
  emptyText: string
  buildingIds: number[]
  deletingIds: number[]
  togglingIds: number[]
  algorithmTypeOptions: string[]
}>()

const emit = defineEmits<{
  build: [item: AlgorithmItem]
  delete: [item: AlgorithmItem]
  toggleVisibility: [item: AlgorithmItem]
}>()

const { t } = useI18n()
const currentLoginKey = localGet(Login.LOGIN_KEY, '') || ''
const selectedType = ref('__all__')
const page = ref(1)
const pageSize = ref(10)

const filteredItems = computed(() => {
  if (selectedType.value === '__all__') return props.items
  return props.items.filter((item) => item.algorithm_type === selectedType.value)
})

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const availableTypes = computed(() => {
  const types = props.items.map((item) => item.algorithm_type).filter(Boolean)
  const preferred = props.algorithmTypeOptions.filter((type) => types.includes(type))
  const extra = [...new Set(types.filter((type) => !preferred.includes(type)))].sort((a, b) => a.localeCompare(b))
  return [...preferred, ...extra]
})

watch(
  () => props.items,
  () => {
    if (selectedType.value !== '__all__' && !props.items.some((item) => item.algorithm_type === selectedType.value)) {
      selectedType.value = '__all__'
    }
    const maxPage = Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
  },
  { deep: true }
)

watch(selectedType, () => {
  page.value = 1
})

watch(pageSize, () => {
  page.value = 1
})

function tagTypeByImportStatus(status: AlgorithmImportStatus) {
  if (status === 'ready') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

function tagTypeByImageStatus(status: AlgorithmImageStatus) {
  if (status === 'ready') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'building') return 'warning'
  return 'info'
}

function formatVisibility(visibility: boolean) {
  return visibility ? t('Algorithm.Visibility.Public') : t('Algorithm.Visibility.Private')
}

function formatStatus(status: string) {
  const key = `Algorithm.StatusText.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

function formatTime(value: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function isBuilding(item: AlgorithmItem, buildingIds: number[]) {
  return buildingIds.includes(item.template_id) || item.image_status === 'building'
}

function isDeleting(item: AlgorithmItem, deletingIds: number[]) {
  return deletingIds.includes(item.template_id)
}

function isToggling(item: AlgorithmItem, togglingIds: number[]) {
  return togglingIds.includes(item.template_id)
}

function isOwner(item: AlgorithmItem) {
  return Boolean(item.owner_name) && item.owner_name === currentLoginKey
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
    <div class="mb-5 flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-slate-900">
        {{ title }}
      </h2>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
        {{ t('Algorithm.AlgorithmsCount', { count: items.length }) }}
      </span>
    </div>

    <div
      v-if="items.length === 0"
      class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-slate-500"
    >
      {{ emptyText }}
    </div>

    <div
      v-else
      class="flex flex-col gap-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-slate-500">{{ t('Algorithm.Filter.Type') }}</span>
        <el-tag
          :type="selectedType === '__all__' ? 'primary' : 'info'"
          class="cursor-pointer"
          effect="plain"
          @click="selectedType = '__all__'"
        >
          {{ t('Algorithm.Filter.All') }}
        </el-tag>
        <el-tag
          v-for="type in availableTypes"
          :key="type"
          :type="selectedType === type ? 'primary' : 'info'"
          class="cursor-pointer"
          effect="plain"
          @click="selectedType = type"
        >
          {{ type }}
        </el-tag>
      </div>

      <el-table
        :data="pagedItems"
        style="width: 100%"
      >
        <el-table-column
          prop="algorithm_name"
          :label="t('Algorithm.Table.AlgorithmName')"
          min-width="180"
        />
        <el-table-column
          prop="algorithm_type"
          :label="t('Algorithm.Table.AlgorithmType')"
          min-width="150"
        />
        <el-table-column
          prop="description"
          :label="t('Algorithm.Table.Description')"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          prop="owner_name"
          :label="t('Algorithm.Table.Owner')"
          min-width="140"
        />
        <el-table-column
          :label="t('Algorithm.Table.Visibility')"
          min-width="110"
        >
          <template #default="{ row }">
            <el-tag type="info">
              {{ formatVisibility(row.visibility) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('Algorithm.Table.Status')"
          min-width="140"
        >
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag :type="tagTypeByImportStatus(row.status)">
                {{ formatStatus(row.status) }}
              </el-tag>
              <el-icon
                v-if="row.status === 'importing'"
                class="is-loading text-amber-500"
              >
                <Loading />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('Algorithm.Table.ImageStatus')"
          min-width="150"
        >
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-tag :type="tagTypeByImageStatus(row.image_status)">
                {{ formatStatus(row.image_status) }}
              </el-tag>
              <el-icon
                v-if="row.image_status === 'building'"
                class="is-loading text-amber-500"
              >
                <Loading />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('Algorithm.Table.CreatedAt')"
          min-width="180"
        >
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="t('Algorithm.Table.Operations')"
          min-width="280"
          fixed="right"
        >
          <template #default="{ row }">
            <div
              v-if="isOwner(row)"
              class="flex flex-wrap items-center gap-3"
            >
              <el-button
                size="small"
                plain
                :loading="isToggling(row, togglingIds)"
                @click="emit('toggleVisibility', row)"
              >
                {{ row.visibility ? t('Algorithm.Actions.MakePrivate') : t('Algorithm.Actions.MakePublic') }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :disabled="row.status !== 'ready' || row.image_status === 'ready'"
                :loading="isBuilding(row, buildingIds)"
                @click="emit('build', row)"
              >
                {{ t('Algorithm.Actions.BuildImage') }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :loading="isDeleting(row, deletingIds)"
                @click="emit('delete', row)"
              >
                {{ t('Algorithm.Actions.Delete') }}
              </el-button>
            </div>
            <span v-else class="text-sm text-slate-400">--</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="filteredItems.length"
          :page-sizes="[5, 10, 20, 50]"
        />
      </div>
    </div>
  </section>
</template>
