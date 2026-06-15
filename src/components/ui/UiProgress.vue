<script setup>
const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  label: { type: String, default: '' },
  status: { type: String, default: '' },
  showInfo: { type: Boolean, default: false },
})

const pct = Math.min(100, Math.max(0, (props.value / props.max) * 100))
</script>

<template>
  <div class="ui-progress-root" role="progressbar" :aria-valuenow="value" :aria-valuemin="0" :aria-valuemax="max">
    <div class="ui-progress-track">
      <div
        class="ui-progress-indicator"
        :class="{ 'ui-progress-success': status === 'success', 'ui-progress-exception': status === 'exception' }"
        :style="{ width: `${pct}%` }"
      ></div>
    </div>
    <div v-if="label || showInfo" class="ui-progress-meta">
      <span v-if="label" class="ui-progress-label">{{ label }}</span>
      <span v-if="showInfo" class="ui-progress-pct">{{ Math.round(pct) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.ui-progress-root { display: grid; gap: 6px; }
.ui-progress-track { height: 10px; overflow: hidden; border-radius: var(--radius-full); background: var(--border-light); }
.ui-progress-indicator { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--primary), var(--primary-strong)); transition: width .3s ease; }
.ui-progress-success { background: linear-gradient(90deg, var(--success), #34D399); }
.ui-progress-exception { background: linear-gradient(90deg, var(--danger), #F87171); }
.ui-progress-meta { display: flex; justify-content: space-between; align-items: center; }
.ui-progress-label { color: var(--text-soft); font-size: .85rem; }
.ui-progress-pct { color: var(--text-faint); font-size: .78rem; font-weight: 600; }
</style>
