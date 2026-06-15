<script setup>
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'

const props = defineProps({
  class: String,
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  closable: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
</script>

<template>
  <span :class="cn('ui-tag', {
    'ui-tag-primary': variant === 'primary',
    'ui-tag-success': variant === 'success',
    'ui-tag-warning': variant === 'warning',
    'ui-tag-danger': variant === 'danger',
    'ui-tag-sm': size === 'sm',
    'ui-tag-active': active,
  }, props.class)">
    <slot />
    <button v-if="closable" class="ui-tag-close" @click.stop="emit('close')">
      <X :size="12" />
    </button>
  </span>
</template>

<style scoped>
.ui-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 14px; border-radius: var(--radius-full); font-size: .8rem; font-weight: 500; border: 1px solid var(--border-light); background: var(--surface-muted); color: var(--text-soft); transition: all .2s ease; cursor: default; }
.ui-tag-primary { background: var(--primary-light); color: var(--primary-strong); border-color: var(--primary); }
.ui-tag-success { background: var(--success-soft); color: var(--success); border-color: var(--success); }
.ui-tag-warning { background: var(--warning-soft); color: var(--warning); border-color: var(--warning); }
.ui-tag-danger { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }
.ui-tag-sm { padding: 2px 10px; font-size: .72rem; }
.ui-tag-active { background: var(--primary); color: #fff; border-color: var(--primary); }
.ui-tag-close { display: inline-flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: inherit; opacity: .6; padding: 0; margin-left: 2px; }
.ui-tag-close:hover { opacity: 1; }
</style>
