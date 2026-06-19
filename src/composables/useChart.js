/**
 * useChart.js — ECharts 图表封装 composable
 * ====================================================
 * 功能：
 *   1. 懒加载 ECharts 库（减小首屏体积）
 *   2. 提供图表初始化、设置 option、resize、销毁等能力
 *   3. 通过 ResizeObserver 监听容器尺寸变化自动 resize
 *
 * 用法：
 *   const { chartRef, initChart, setOption, resize, dispose } = useChart()
 *   onMounted(async () => { await initChart(); setOption({...}) })
 */

import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'

/**
 * ECharts 图表 composable
 * @returns {{
 *   chartRef: import('vue').Ref<HTMLElement|null>,  // 图表容器 ref（绑定到 DOM）
 *   chartInstance: import('vue').ShallowRef,        // ECharts 实例
 *   initChart: () => Promise,                        // 初始化图表
 *   setOption: (option: object, notMerge?: boolean) => void, // 设置 option
 *   resize: () => void,                              // 调整图表尺寸
 *   dispose: () => void                              // 销毁图表
 * }}
 */
export function useChart() {
  // 图表容器的 DOM ref（在模板中 :ref="chartRef" 绑定）
  const chartRef = ref(null)
  // ECharts 实例（shallowRef 避免深度响应式，提高性能）
  const chartInstance = shallowRef(null)

  /**
   * 初始化 ECharts 实例
   * - 懒加载 echarts 模块
   * - 必须在 DOM 挂载完成后调用
   * @returns {Promise} ECharts 实例
   */
  async function initChart() {
    if (!chartRef.value) return
    const echarts = await import('echarts')
    chartInstance.value = echarts.init(chartRef.value)
    return chartInstance.value
  }

  /**
   * 设置图表 option
   * @param {Object} option - ECharts 配置对象
   * @param {boolean} [notMerge=true] - 是否不与上一次 option 合并（默认完全替换）
   */
  function setOption(option, notMerge = true) {
    if (!chartInstance.value) return
    chartInstance.value.setOption(option, notMerge)
  }

  /** 触发图表重绘（响应容器尺寸变化） */
  function resize() {
    chartInstance.value?.resize()
  }

  /** 销毁 ECharts 实例（释放资源） */
  function dispose() {
    chartInstance.value?.dispose()
    chartInstance.value = null
  }

  // ==================== 生命周期 ====================

  /** ResizeObserver 实例：监听容器尺寸变化并自动 resize */
  let resizeObserver = null

  onMounted(() => {
    // 创建 ResizeObserver 监听容器尺寸变化
    resizeObserver = new ResizeObserver(() => {
      resize()
    })
    if (chartRef.value) {
      resizeObserver.observe(chartRef.value)
    }
  })

  onUnmounted(() => {
    // 组件卸载时清理监听并销毁图表，避免内存泄漏
    resizeObserver?.disconnect()
    dispose()
  })

  return { chartRef, chartInstance, initChart, setOption, resize, dispose }
}
