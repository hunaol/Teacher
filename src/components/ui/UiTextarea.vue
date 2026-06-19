<!--
  UiTextarea.vue — 多行文本输入
  ====================================================
  基于 v-model 双向绑定的简易 textarea，可设置行数与占位提示。
-->
<script setup>
import { cn } from '@/lib/utils'

// v-model 双向绑定
const model = defineModel()
// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 可见行数
  rows: { type: [String, Number], default: 4 },
  // 占位提示
  placeholder: String,
  // 是否只读
  readonly: Boolean,
})
</script>

<template>
  <textarea v-model="model" :rows="rows" :placeholder="placeholder" :readonly="readonly" :class="cn('ui-textarea', props.class)" />
</template>
