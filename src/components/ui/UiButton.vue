<!--
  UiButton.vue — 通用按钮组件
  ====================================================
  支持多 variant（primary/secondary/outline/ghost/danger）、多 size（sm/md/lg），
  异步 loading 状态以及任意标签渲染（通过 as 属性）。同时透传 attrs，
  允许父组件直接传入原生属性（如 type、aria-* 等）。
-->
<script setup>
import { useAttrs } from 'vue'
import { cn } from '@/lib/utils'

// 禁用默认 attrs 自动绑定到根节点，避免重复渲染
defineOptions({ inheritAttrs: false })

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 颜色变体
  variant: { type: String, default: 'default' },
  // 尺寸
  size: { type: String, default: 'md' },
  // 渲染的标签名（button / a / RouterLink 等）
  as: { type: String, default: 'button' },
  // 是否占满整行
  block: { type: Boolean, default: false },
  // 加载中状态（带 spinner）
  loading: { type: Boolean, default: false },
  // 禁用状态
  disabled: { type: Boolean, default: false },
})

// 拿到未被 props 声明的 attributes，转发给动态标签
const attrs = useAttrs()
</script>

<template>
  <component
    :is="as"
    v-bind="attrs"
    :disabled="disabled || loading"
    :class="cn(
      'ui-btn',
      {
        'ui-btn-primary': variant === 'primary',
        'ui-btn-secondary': variant === 'secondary',
        'ui-btn-outline': variant === 'outline',
        'ui-btn-ghost': variant === 'ghost',
        'ui-btn-danger': variant === 'danger',
        'ui-btn-sm': size === 'sm',
        'ui-btn-lg': size === 'lg',
        'ui-btn-block': block,
        'ui-btn-loading': loading,
      },
      props.class,
    )"
  >
    <span v-if="loading" class="ui-btn-spinner"></span>
    <slot />
  </component>
</template>

<style scoped>
.ui-btn-sm { padding: 6px 14px; font-size: .8rem; min-height: 34px; border-radius: var(--radius-sm); }
.ui-btn-lg { padding: 14px 28px; font-size: .95rem; min-height: 48px; }
.ui-btn-block { width: 100%; }
.ui-btn-outline { background: transparent; border-color: var(--primary); color: var(--primary); }
.ui-btn-outline:hover { background: var(--primary-light); border-color: var(--primary-strong); }
.ui-btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); box-shadow: 0 2px 8px rgba(239,68,68,.25); }
.ui-btn-danger:hover { background: #DC2626; box-shadow: 0 6px 20px rgba(239,68,68,.35); transform: translateY(-1px); }
.ui-btn-loading { pointer-events: none; opacity: .8; }
.ui-btn-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
