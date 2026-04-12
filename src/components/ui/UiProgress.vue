<script setup>
const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  label: { type: String, default: '' },
})
</script>

<template>
  <div class="ui-progress-root" role="progressbar" :aria-valuenow="value" :aria-valuemin="0" :aria-valuemax="max">
    <div class="ui-progress-track">
      <div class="ui-progress-indicator" :style="{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }"></div>
    </div>
    <div v-if="label" class="ui-progress-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.ui-progress-root {
  display: grid;
  gap: 8px;
}
.ui-progress-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(207, 220, 235, 0.8);
}
.ui-progress-indicator {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width .2s ease;
}
.ui-progress-label {
  color: var(--text-soft);
  font-size: .88rem;
}
</style>
