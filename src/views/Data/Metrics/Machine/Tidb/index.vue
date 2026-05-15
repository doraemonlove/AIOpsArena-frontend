<script setup lang="ts">
import MetricInspector from '../shared/MetricInspector.vue'
import ChartsBoard from '../shared/ChartsBoard.vue'
</script>

<template>
  <div class="min-h-full px-8 py-8">
    <MetricInspector
      title="TiDB Metrics"
      description="Select TiDB recorded metrics at namespace scope."
      empty-hint="TiDB metrics are namespace scoped"
    />

    <ChartsBoard empty-message="Add one or more TiDB metrics to render charts." />
  </div>
</template>
