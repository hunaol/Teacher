<!--
  UiSkeleton.vue — 骨架屏占位
  ====================================================
  渲染可配置的占位形状（text/circle/rect/card），通过 count 控制行数，
  可选 shimmer 动画。常用于数据加载时的占位渲染。
-->
<script setup>
import { cn } from '@/lib/utils'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 占位类型：text | circle | rect | card
  type: { type: String, default: 'text' },
  // 宽度（非 circle 时生效）
  width: { type: String, default: '100%' },
  // 高度（circle 时也作为直径）
  height: { type: String, default: '16px' },
  // 是否启用 shimmer 动画
  animated: { type: Boolean, default: true },
  // 渲染占位元素数量
  count: { type: Number, default: 1 },
})
</script>

<template>
  <template v-for="i in count" :key="i">
    <div
      :class="cn('ui-skeleton', {
        'ui-skeleton-circle': type === 'circle',
        'ui-skeleton-rect': type === 'rect',
        'ui-skeleton-card': type === 'card',
        'ui-skeleton-animated': animated,
      }, props.class)"
      :style="{ width: type === 'circle' ? height : width, height }"
    ></div>
  </template>
</template>

<style scoped>
.ui-skeleton { background: var(--border-light); border-radius: var(--radius-sm); }
.ui-skeleton-circle { border-radius: 50%; }
.ui-skeleton-rect { border-radius: var(--radius-sm); }
.ui-skeleton-card { border-radius: var(--radius-lg); height: 200px; }
.ui-skeleton-animated { background: linear-gradient(90deg, var(--border-light) 25%, var(--bg-soft) 50%, var(--border-light) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
</style>
