<script setup lang="ts">
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="min-h-full px-8 py-8">
    <MetricInspector
      :title="t('Data.MetricsMachine.TiDB.MetricsTitle')"
      :description="t('Data.MetricsMachine.TiDB.MetricsDescription')"
      :empty-hint="t('Data.MetricsMachine.TiDB.EmptyHint')"
    />

    <ChartsBoard :empty-message="t('Data.MetricsMachine.TiDB.EmptyChartMessage')" />
  </div>
</template>
