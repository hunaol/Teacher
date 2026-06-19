<!--
  UiEmpty.vue — 空状态占位
  ====================================================
  用于列表/搜索等场景无数据时的占位展示，
  默认使用 SearchX 图标，支持自定义图像与底部操作按钮。
-->
<script setup>
import { cn } from '@/lib/utils'
import { SearchX } from 'lucide-vue-next'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 描述文案
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
