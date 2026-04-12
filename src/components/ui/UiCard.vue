<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  as: { type: String, default: 'div' },
})
</script>

<template>
  <component :is="as" :class="cn('ui-card', props.class)">
    <slot />
  </component>
</template>
