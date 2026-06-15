<script setup>
import { cn } from '@/lib/utils'
import { SearchX } from 'lucide-vue-next'

const props = defineProps({
  class: String,
  description: { type: String, default: '暂无数据' },
})
</script>

<template>
  <div :class="cn('ui-empty', props.class)">
    <div class="ui-empty-icon">
      <slot name="image">
        <SearchX :size="48" />
      </slot>
    </div>
    <p class="ui-empty-text">{{ description }}</p>
    <div v-if="$slots.action" class="ui-empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.ui-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
.ui-empty-icon { color: var(--text-faint); margin-bottom: 16px; opacity: .5; }
.ui-empty-text { color: var(--text-faint); font-size: .92rem; margin: 0; }
.ui-empty-action { margin-top: 20px; }
</style>
