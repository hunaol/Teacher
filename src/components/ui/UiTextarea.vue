<script setup>
import { cn } from '@/lib/utils'

const model = defineModel()
const props = defineProps({
  class: String,
  rows: { type: [String, Number], default: 4 },
  placeholder: String,
  readonly: Boolean,
})
</script>

<template>
  <textarea v-model="model" :rows="rows" :placeholder="placeholder" :readonly="readonly" :class="cn('ui-textarea', props.class)" />
</template>
