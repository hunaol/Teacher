<script setup>
import { cn } from '@/lib/utils'

const model = defineModel()
const props = defineProps({
  class: String,
  placeholder: String,
  readonly: Boolean,
  type: { type: String, default: 'text' },
})
</script>

<template>
  <input v-model="model" :type="type" :placeholder="placeholder" :readonly="readonly" :class="cn('ui-input', props.class)" />
</template>
