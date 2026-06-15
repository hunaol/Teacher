<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  variant: { type: String, default: 'default' },
})

const emit = defineEmits(['update:modelValue'])
const active = computed(() => props.modelValue || props.items[0]?.value || '')
</script>

<template>
  <div class="ui-tabs-root">
    <div class="ui-tabs-list" :class="{ 'ui-tabs-underline': variant === 'underline' }">
      <button
        v-for="item in items" :key="item.value" type="button"
        class="ui-tabs-trigger" :class="{ active: active === item.value }"
        @click="emit('update:modelValue', item.value)"
      >
        <slot name="icon" :item="item" />
        <span>{{ item.label }}</span>
      </button>
    </div>
    <div class="ui-tabs-content">
      <slot :active="active" />
    </div>
  </div>
</template>

<style scoped>
.ui-tabs-root { display: grid; gap: 14px; }
.ui-tabs-list { display: inline-flex; align-items: center; gap: 4px; padding: 5px; border-radius: var(--radius-md); background: var(--bg-soft); border: 1px solid var(--border-light); overflow-x: auto; }
.ui-tabs-trigger { min-height: 38px; padding: 0 16px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 8px; color: var(--text-soft); border: none; background: none; cursor: pointer; transition: all .18s ease; font-size: .85rem; font-weight: 500; }
.ui-tabs-trigger:hover { color: var(--text); background: var(--surface); }
.ui-tabs-trigger.active { background: var(--surface); color: var(--primary-strong); box-shadow: var(--shadow-sm); font-weight: 600; }
.ui-tabs-underline { border-radius: 0; border: none; border-bottom: 2px solid var(--border-light); background: transparent; gap: 0; padding: 0; }
.ui-tabs-underline .ui-tabs-trigger { border-radius: 0; border-bottom: 2px solid transparent; margin-bottom: -2px; background: transparent !important; box-shadow: none !important; }
.ui-tabs-underline .ui-tabs-trigger.active { border-bottom-color: var(--primary); color: var(--primary); background: transparent !important; }
.ui-tabs-content { display: grid; gap: 12px; }
</style>
