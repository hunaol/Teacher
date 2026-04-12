<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
})
</script>

<template>
  <span :class="cn('ui-badge', props.class)">
    <slot />
  </span>
</template>
