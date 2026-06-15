<script setup>
import { useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  class: String,
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'md' },
  as: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const attrs = useAttrs()
</script>

<template>
  <component
    :is="as"
    v-bind="attrs"
    :disabled="disabled || loading"
    :class="cn(
      'ui-btn',
      {
        'ui-btn-primary': variant === 'primary',
        'ui-btn-secondary': variant === 'secondary',
        'ui-btn-outline': variant === 'outline',
        'ui-btn-ghost': variant === 'ghost',
        'ui-btn-danger': variant === 'danger',
        'ui-btn-sm': size === 'sm',
        'ui-btn-lg': size === 'lg',
        'ui-btn-block': block,
        'ui-btn-loading': loading,
      },
      props.class,
    )"
  >
    <span v-if="loading" class="ui-btn-spinner"></span>
    <slot />
  </component>
</template>

<style scoped>
.ui-btn-sm { padding: 6px 14px; font-size: .8rem; min-height: 34px; border-radius: var(--radius-sm); }
.ui-btn-lg { padding: 14px 28px; font-size: .95rem; min-height: 48px; }
.ui-btn-block { width: 100%; }
.ui-btn-outline { background: transparent; border-color: var(--primary); color: var(--primary); }
.ui-btn-outline:hover { background: var(--primary-light); border-color: var(--primary-strong); }
.ui-btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); box-shadow: 0 2px 8px rgba(239,68,68,.25); }
.ui-btn-danger:hover { background: #DC2626; box-shadow: 0 6px 20px rgba(239,68,68,.35); transform: translateY(-1px); }
.ui-btn-loading { pointer-events: none; opacity: .8; }
.ui-btn-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
