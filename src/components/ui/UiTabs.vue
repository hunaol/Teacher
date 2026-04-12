<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const active = computed(() => props.modelValue || props.items[0]?.value || '')
</script>

<template>
  <div class="ui-tabs-root">
    <div class="ui-tabs-list">
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        class="ui-tabs-trigger"
        :class="{ active: active === item.value }"
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
.ui-tabs-root {
  display: grid;
  gap: 12px;
}
.ui-tabs-list {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  padding: 6px;
  border-radius: 18px;
  background: rgba(232, 241, 251, 0.8);
  border: 1px solid rgba(159, 184, 214, 0.4);
  overflow-x: auto;
}
.ui-tabs-trigger {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-soft);
  transition: all .18s ease;
}
.ui-tabs-trigger.active {
  background: #fff;
  color: var(--primary-strong);
  box-shadow: 0 6px 18px rgba(55, 93, 135, 0.12);
}
.ui-tabs-content {
  display: grid;
  gap: 12px;
}
</style>
