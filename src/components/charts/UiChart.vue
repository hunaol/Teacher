<!--
  UiChart.vue — ECharts 通用图表容器
  ====================================================
  按需 import('echarts') 减小首屏体积，自动监听容器尺寸变化以重绘图表，
  并在卸载时释放实例避免内存泄漏。父组件只需传入 ECharts option 即可。
-->
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { cn } from '@/lib/utils'

// 组件属性定义
const props = defineProps({
  // 自定义类名
  class: String,
  // ECharts 配置项
  option: { type: Object, default: () => ({}) },
  // 图表高度
  height: { type: String, default: '400px' },
  // 是否显示加载遮罩
  loading: { type: Boolean, default: false },
})

// 容器 DOM 引用
const chartRef = ref(null)
// ECharts 实例
let chart = null
// ResizeObserver 实例：用于监听容器尺寸变化
let resizeObserver = null

// 挂载后按需加载 echarts 并初始化实例
onMounted(async () => {
  if (!chartRef.value) return
  const echarts = await import('echarts')
  chart = echarts.init(chartRef.value)
  if (props.option && Object.keys(props.option).length) {
    chart.setOption(props.option, true)
  }
  // 监听容器尺寸变化并自动 resize
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartRef.value)
})

// 深度监听 option 变化并更新图表
watch(() => props.option, (newOpt) => {
  if (chart && newOpt && Object.keys(newOpt).length) {
    chart.setOption(newOpt, true)
  }
}, { deep: true })

// 卸载时释放所有资源
onUnmounted(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div :class="cn('ui-chart-wrapper', props.class)">
    <div v-if="loading" class="ui-chart-loading">加载中…</div>
    <div ref="chartRef" :style="{ height, width: '100%' }"></div>
  </div>
</template>

<style scoped>
.ui-chart-wrapper { position: relative; width: 100%; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border-light); padding: 16px; box-shadow: var(--shadow-xs); }
.ui-chart-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.8); z-index: 2; border-radius: inherit; color: var(--text-faint); font-size: .88rem; }
</style>
