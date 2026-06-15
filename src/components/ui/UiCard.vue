<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  as: { type: String, default: 'div' },
  hover: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  padding: { type: String, default: 'md' },
})
</script>

<template>
  <component
    :is="as"
    :class="cn(
      'ui-card',
      {
        'ui-card-hover': hover,
        'ui-card-clickable': clickable,
        'ui-card-pad-sm': padding === 'sm',
        'ui-card-pad-lg': padding === 'lg',
      },
      props.class,
    )"
  >
    <div v-if="$slots.header" class="ui-card-header">
      <slot name="header" />
    </div>
    <div class="ui-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="ui-card-footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<style scoped>
.ui-card-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--primary); }
.ui-card-clickable { cursor: pointer; }
.ui-card-pad-sm { padding: 16px; }
.ui-card-pad-lg { padding: 32px; }
.ui-card-header { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); }
.ui-card-footer { padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--border-light); }
</style>
