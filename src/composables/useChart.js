import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'

/**
 * ECharts 图表 composable
 * 管理图表的初始化、更新、resize 和销毁
 * @returns {{ chartRef, chartInstance, initChart, setOption, resize, dispose }}
 */
export function useChart() {
  const chartRef = ref(null)
  const chartInstance = shallowRef(null)

  async function initChart() {
    if (!chartRef.value) return
    const echarts = await import('echarts')
    chartInstance.value = echarts.init(chartRef.value)
    return chartInstance.value
  }

  function setOption(option, notMerge = true) {
    if (!chartInstance.value) return
    chartInstance.value.setOption(option, notMerge)
  }

  function resize() {
    chartInstance.value?.resize()
  }

  function dispose() {
    chartInstance.value?.dispose()
    chartInstance.value = null
  }

  let resizeObserver = null
  onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
      resize()
    })
    if (chartRef.value) {
      resizeObserver.observe(chartRef.value)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    dispose()
  })

  return { chartRef, chartInstance, initChart, setOption, resize, dispose }
}
