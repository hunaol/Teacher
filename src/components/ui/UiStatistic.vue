<!--
  UiStatistic.vue — 统计数字卡片
  ====================================================
  用于展示关键指标，含 title/value/prefix/suffix 与趋势（up/down）指示。
-->
<script setup>
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // 指标标题
  title: { type: String, default: '' },
  // 指标数值
  value: { type: [String, Number], default: '' },
  // 数值前缀（如货币符号）
  prefix: { type: String, default: '' },
  // 数值后缀（如单位）
  suffix: { type: String, default: '' },
  // 趋势：up | down
  trend: { type: String, default: '' },
  // 趋势描述文本
  trendLabel: { type: String, default: '' },
})
</script>

<template>
  <div :class="cn('ui-statistic', props.class)">
    <div class="ui-statistic-title">{{ title }}</div>
    <div class="ui-statistic-value">
      <span v-if="prefix" class="ui-statistic-prefix">{{ prefix }}</span>
      <span class="ui-statistic-number">{{ value }}</span>
      <span v-if="suffix" class="ui-statistic-suffix">{{ suffix }}</span>
    </div>
    <div v-if="trend" class="ui-statistic-trend" :class="{ 'ui-statistic-trend-up': trend === 'up', 'ui-statistic-trend-down': trend === 'down' }">
      <TrendingUp v-if="trend === 'up'" :size="14" />
      <TrendingDown v-if="trend === 'down'" :size="14" />
      <span>{{ trendLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.ui-statistic { padding: 20px 24px; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); }
.ui-statistic-title { font-size: .82rem; color: var(--text-soft); margin-bottom: 6px; }
.ui-statistic-value { display: flex; align-items: baseline; gap: 4px; }
.ui-statistic-number { font-size: 1.8rem; font-weight: 700; color: var(--text); line-height: 1.2; }
.ui-statistic-prefix, .ui-statistic-suffix { font-size: .95rem; color: var(--text-soft); }
.ui-statistic-trend { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; margin-top: 6px; }
.ui-statistic-trend-up { color: var(--success); }
.ui-statistic-trend-down { color: var(--danger); }
</style>
