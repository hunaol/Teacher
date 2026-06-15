<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'md' },
  shape: { type: String, default: 'rounded' },
  name: { type: String, default: '' },
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.slice(0, 2)
})

const bgColor = computed(() => {
  const colors = ['#D98C52', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  let hash = 0
  for (let i = 0; i < (props.name || '?').length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})
</script>

<template>
  <div
    :class="cn('ui-avatar', {
      'ui-avatar-circle': shape === 'circle',
      'ui-avatar-sm': size === 'sm',
      'ui-avatar-lg': size === 'lg',
    }, props.class)"
    :style="{ background: !src ? bgColor : undefined }"
  >
    <img v-if="src" :src="src" :alt="alt" class="ui-avatar-img" />
    <span v-else class="ui-avatar-fallback">{{ initials }}</span>
  </div>
</template>

<style scoped>
.ui-avatar { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.ui-avatar-circle { border-radius: 50%; }
.ui-avatar-sm { width: 32px; height: 32px; border-radius: var(--radius-sm); }
.ui-avatar-lg { width: 56px; height: 56px; border-radius: var(--radius-lg); }
.ui-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.ui-avatar-fallback { color: #fff; font-weight: 600; font-size: .85rem; }
.ui-avatar-sm .ui-avatar-fallback { font-size: .7rem; }
.ui-avatar-lg .ui-avatar-fallback { font-size: 1.1rem; }
</style>
