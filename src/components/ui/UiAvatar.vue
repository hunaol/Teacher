<!--
  UiAvatar.vue — 通用头像组件
  ====================================================
  提供三种渲染方式：
    1. 传入 src 时使用真实图片
    2. 否则根据 name 生成颜色背景 + 文字缩写作为 fallback
  支持尺寸（sm/md/lg）和形状（rounded/circle）配置。
-->
<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// 组件属性定义
const props = defineProps({
  // 自定义类名（用于覆盖样式）
  class: String,
  // 头像图片地址
  src: { type: String, default: '' },
  // 图片 alt 文本
  alt: { type: String, default: '' },
  // 头像尺寸：sm | md | lg
  size: { type: String, default: 'md' },
  // 头像形状：rounded | circle
  shape: { type: String, default: 'rounded' },
  // 用户名（用于生成 fallback 文字与背景色）
  name: { type: String, default: '' },
})

// 取用户名前两个字符作为头像中的占位文字
const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.slice(0, 2)
})

// 通过 name 的 hash 值从预定义色板中挑选稳定颜色，保证同一用户始终呈现同一色
const bgColor = computed(() => {
  const colors = ['#D98C52', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  let hash = 0
  for (let i = 0; i < (props.name || '?').length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})
</script>

<template>
  <div :class="cn('ui-avatar', {
    'ui-avatar-circle': shape === 'circle',
    'ui-avatar-sm': size === 'sm',
    'ui-avatar-lg': size === 'lg',
  }, props.class)" :style="{ background: !src ? bgColor : undefined }">
    <img v-if="src" :src="src" :alt="alt" class="ui-avatar-img" />
    <span v-else class="ui-avatar-fallback">{{ initials }}</span>
  </div>
</template>

<style scoped>
.ui-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.ui-avatar-circle {
  border-radius: 50%;
}

.ui-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
}

.ui-avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
}

.ui-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ui-avatar-fallback {
  color: #fff;
  font-weight: 600;
  font-size: .85rem;
}

.ui-avatar-sm .ui-avatar-fallback {
  font-size: .7rem;
}

.ui-avatar-lg .ui-avatar-fallback {
  font-size: 1.1rem;
}
</style>
