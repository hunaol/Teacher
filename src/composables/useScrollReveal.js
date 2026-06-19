/**
 * useScrollReveal.js — 滚动入场动画 composable
 * ====================================================
 * 当绑定该 composable 的元素进入视口时触发 isRevealed，
 * 可结合 CSS 过渡/动画 class 实现滚动出现的效果。
 *
 * 用法：
 *   <div :ref="elementRef" :class="{ revealed: isRevealed }">...</div>
 */

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 滚动入场动画 composable
 * @param {Object} [options]
 * @param {number} [options.threshold=0.1] - 可见比例阈值 (0-1)
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] - 提前/延后触发距离
 * @param {boolean} [options.once=true] - 是否只触发一次
 * @returns {{ isRevealed: Ref<boolean>, elementRef: Ref<HTMLElement|null> }}
 */
export function useScrollReveal(options = {}) {
  // 解构配置并提供默认值
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', once = true } = options
  // 是否已进入视口（驱动 CSS class 切换）
  const isRevealed = ref(false)
  // 元素 ref（在模板中绑定）
  const elementRef = ref(null)
  // IntersectionObserver 实例（保存以便清理）
  let observer = null

  onMounted(() => {
    if (!elementRef.value) return
    // 创建 IntersectionObserver 监听元素可见性
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 元素进入视口
            isRevealed.value = true
            if (once) observer?.unobserve(entry.target) // once 模式下停止观察
          } else if (!once) {
            // 非 once 模式下，元素离开视口时复位（用于反复触发动画）
            isRevealed.value = false
          }
        })
      },
      { threshold, rootMargin },
    )
    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    // 组件卸载时断开观察，避免内存泄漏
    observer?.disconnect()
  })

  return { isRevealed, elementRef }
}
