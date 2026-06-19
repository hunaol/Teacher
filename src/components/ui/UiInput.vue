<!--
  UiInput.vue — 通用输入框
  ====================================================
  基于 v-model 双向绑定，支持 prefix/suffix 自定义插槽与清除按钮，
  并可在下方展示错误提示信息。
-->
<script setup>
import { cn } from '@/lib/utils'

// v-model 双向绑定
const model = defineModel()
// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 占位提示
  placeholder: String,
  // 是否只读
  readonly: Boolean,
  // 输入框类型
  type: { type: String, default: 'text' },
  // 错误信息文案
  error: { type: String, default: '' },
  // 是否显示清除按钮（输入框非空时）
  clearable: { type: Boolean, default: false },
})
</script>

<template>
  <div :class="cn('ui-input-wrapper', props.class)">
    <div class="ui-input-inner">
      <span v-if="$slots.prefix" class="ui-input-prefix"><slot name="prefix" /></span>
      <input v-model="model" :type="type" :placeholder="placeholder" :readonly="readonly" class="ui-input" />
      <span v-if="$slots.suffix" class="ui-input-suffix"><slot name="suffix" /></span>
      <button v-if="clearable && model" class="ui-input-clear" @click="model = ''">&times;</button>
    </div>
    <p v-if="error" class="ui-input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-input-wrapper { display: grid; gap: 4px; }
.ui-input-inner { display: flex; align-items: center; position: relative; }
.ui-input { flex: 1; width: 100%; }
.ui-input-prefix, .ui-input-suffix { display: flex; align-items: center; padding: 0 8px; color: var(--text-faint); }
.ui-input-clear { position: absolute; right: 10px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-faint); padding: 2px; }
.ui-input-error { color: var(--danger); font-size: .78rem; margin: 0; }
</style>
