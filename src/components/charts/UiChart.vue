<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: String,
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '400px' },
  loading: { type: Boolean, default: false },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

onMounted(async () => {
  if (!chartRef.value) return
  const echarts = await import('echarts')
  chart = echarts.init(chartRef.value)
  if (props.option && Object.keys(props.option).length) {
    chart.setOption(props.option, true)
  }
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(() => props.option, (newOpt) => {
  if (chart && newOpt && Object.keys(newOpt).length) {
    chart.setOption(newOpt, true)
  }
}, { deep: true })

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
