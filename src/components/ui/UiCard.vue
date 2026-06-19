<!--
  UiCard.vue — 卡片容器
  ====================================================
  提供统一的内容容器，支持 header / body / footer 三段式插槽，
  可配置是否悬停抬升、是否可点击以及内边距尺寸。
-->
<script setup>
import { cn } from '@/lib/utils'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 渲染的标签名
  as: { type: String, default: 'div' },
  // 是否启用悬停抬升效果
  hover: { type: Boolean, default: false },
  // 是否可点击（带指针手势）
  clickable: { type: Boolean, default: false },
  // 内边距尺寸：sm | md | lg
  padding: { type: String, default: 'md' },
})
</script>

<template>
  <component :is="as" :class="cn(
    'ui-card',
    {
      'ui-card-hover': hover,
      'ui-card-clickable': clickable,
      'ui-card-pad-sm': padding === 'sm',
      'ui-card-pad-lg': padding === 'lg',
    },
    props.class,
  )">
    <div v-if="$slots.header" class="ui-card-header">
      <slot name="header" />
    </div>
    <div class="ui-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="ui-card-footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<style scoped>
.ui-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: var(--primary);
}

.ui-card-clickable {
  cursor: pointer;
}

.ui-card-pad-sm {
  padding: 16px;
}

.ui-card-pad-lg {
  padding: 32px;
}

.ui-card-header {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.ui-card-footer {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--border-light);
}
</style>
