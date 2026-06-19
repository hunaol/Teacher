<!--
  UiBadge.vue — 徽章组件
  ====================================================
  用于展示状态标签或计数徽章，支持多种语义颜色（success/warning/danger/info）
  以及可选的小圆点指示器。
-->
<script setup>
import { cn } from '@/lib/utils'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 颜色变体：default | success | warning | danger | info
  variant: { type: String, default: 'default' },
  // 是否显示左侧小圆点
  dot: { type: Boolean, default: false },
})
</script>

<template>
  <span :class="cn('ui-badge', {
    'ui-badge-success': variant === 'success',
    'ui-badge-warning': variant === 'warning',
    'ui-badge-danger': variant === 'danger',
    'ui-badge-info': variant === 'info',
    'ui-badge-dot': dot,
  }, props.class)">
    <span v-if="dot" class="ui-badge-dot-indicator"></span>
    <slot />
  </span>
</template>

<style scoped>
.ui-badge-success { background: var(--success-soft); color: var(--success); border-color: var(--success); }
.ui-badge-warning { background: var(--warning-soft); color: var(--warning); border-color: var(--warning); }
.ui-badge-danger { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }
.ui-badge-info { background: var(--info-soft); color: var(--info); border-color: var(--info); }
.ui-badge-dot { gap: 8px; }
.ui-badge-dot-indicator { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
</style>
