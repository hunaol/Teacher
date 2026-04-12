<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  variant: { type: String, default: 'default' },
  as: { type: String, default: 'button' },
})
</script>

<template>
  <component
    :is="as"
    :class="cn('ui-btn', props.variant === 'secondary' && 'ui-btn-secondary', props.variant === 'ghost' && 'ui-btn-ghost', props.class)"
  >
    <slot />
  </component>
</template>
