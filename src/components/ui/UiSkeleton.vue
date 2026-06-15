<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  type: { type: String, default: 'text' },
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' },
  animated: { type: Boolean, default: true },
  count: { type: Number, default: 1 },
})
</script>

<template>
  <template v-for="i in count" :key="i">
    <div
      :class="cn('ui-skeleton', {
        'ui-skeleton-circle': type === 'circle',
        'ui-skeleton-rect': type === 'rect',
        'ui-skeleton-card': type === 'card',
        'ui-skeleton-animated': animated,
      }, props.class)"
      :style="{ width: type === 'circle' ? height : width, height }"
    ></div>
  </template>
</template>

<style scoped>
.ui-skeleton { background: var(--border-light); border-radius: var(--radius-sm); }
.ui-skeleton-circle { border-radius: 50%; }
.ui-skeleton-rect { border-radius: var(--radius-sm); }
.ui-skeleton-card { border-radius: var(--radius-lg); height: 200px; }
.ui-skeleton-animated { background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-soft) 50%, var(--border-light) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
</style>
