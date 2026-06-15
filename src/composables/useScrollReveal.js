import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 滚动入场动画 composable
 * 当元素进入视口时触发 isRevealed，配合 CSS 动画 class 使用
 * @param {Object} options - IntersectionObserver 配置
 * @param {number} options.threshold - 可见比例阈值 (0-1)
 * @param {string} options.rootMargin - 提前/延后触发距离
 * @param {boolean} options.once - 是否只触发一次
 * @returns {{ isRevealed, elementRef }}
 */
export function useScrollReveal(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', once = true } = options
  const isRevealed = ref(false)
  const elementRef = ref(null)
  let observer = null

  onMounted(() => {
    if (!elementRef.value) return
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isRevealed.value = true
            if (once) observer?.unobserve(entry.target)
          } else if (!once) {
            isRevealed.value = false
          }
        })
      },
      { threshold, rootMargin },
    )
    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { isRevealed, elementRef }
}
