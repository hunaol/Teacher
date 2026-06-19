/**
 * useSpeechRecognition.js — 语音识别 composable
 * ====================================================
 * 提供双方案的语音转写能力：
 *   A. 浏览器本地 SpeechRecognition（Chrome/Edge 原生支持）
 *   B. MediaRecorder 录音 + 后端 API 转写（兜底方案）
 *
 * 自动降级：当浏览器原生识别不可用（网络/服务限制）时，
 * 自动切换到 B 方案，确保功能可用。
 *
 * 用法：
 *   const { liveText, isListening, error, start, stop, reset } = useSpeechRecognition()
 *   start()  // 开始录音
 *   stop()   // 停止录音并转写
 */

import { ref, onBeforeUnmount } from 'vue'
import { transcribeSpeech } from '../api/speech'

/**
 * 语音识别 composable
 * @returns {{
 *   liveText: import('vue').Ref<string>,        // 实时识别的文本
 *   isListening: import('vue').Ref<boolean>,     // 是否正在录音
 *   error: import('vue').Ref<string>,            // 错误信息
 *   supported: import('vue').Ref<boolean>,       // 是否支持
 *   start: () => void,                            // 开始录音
 *   stop: () => void,                             // 停止录音
 *   reset: (value?: string) => void               // 重置文本
 * }}
 */
export function useSpeechRecognition() {
  // 当前识别的累计文本
  const liveText = ref('')
  // 是否正在录音中
  const isListening = ref(false)
  // 错误信息
  const error = ref('')
  // 是否支持（保留字段，供 UI 提示用）
  const supported = ref(true)

  // ==================== 内部状态 ====================

  /** 浏览器 SpeechRecognition 实例 */
  let recognition = null
  /** MediaRecorder 实例（API 方案） */
  let mediaRecorder = null
  /** 录音分片（API 方案） */
  let chunks = []
  /** 是否需要重启识别（用于 continuous 模式） */
  let shouldRestart = false
  /** 是否已切换到 API 方案（避免循环重启） */
  let useApiFallback = false

  // ==================== 方案 A：浏览器本地识别 ====================

  /**
   * 尝试启动浏览器原生 SpeechRecognition
   * @returns {boolean} true 表示成功启动；false 表示浏览器不支持
   */
  function tryLocalStart() {
    const Klass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Klass) return false

    recognition = new Klass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'zh-CN'

    // 识别结果回调
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // 仅在最终结果时追加到累计文本
        if (event.results[i].isFinal) {
          liveText.value = liveText.value + event.results[i][0].transcript
        }
      }
    }

    // 错误处理
    recognition.onerror = (event) => {
      // 网络错误/服务不可用：浏览器识别底层是 Google 服务，墙内经常失败
      // → 自动切换到 API 方案
      if (event.error === 'network' || event.error === 'service-not-allowed') {
        useApiFallback = true
        stop()
        startApiRecording()
        return
      }
      // 权限被拒绝
      if (event.error === 'not-allowed') {
        error.value = '麦克风权限被拒绝，请在浏览器设置中允许'
        isListening.value = false
      }
      // no-speech / aborted 等情况静默处理
    }

    // 识别结束
    recognition.onend = () => {
      // 如果用户仍在录音状态且未切到 API 方案，尝试重启
      if (shouldRestart && recognition && !useApiFallback) {
        try { recognition.start(); return } catch { /* 忽略重启失败 */ }
      }
      isListening.value = false
    }

    recognition.start()
    return true
  }

  // ==================== 方案 B：MediaRecorder + API 转写 ====================

  /**
   * 启动 API 方案：录音 + 结束后上传到后端转写
   */
  async function startApiRecording() {
    error.value = ''
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // 优先使用 opus 编码（体积小、效果好）
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
      chunks = []

      // 收集录音分片
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      // 录音结束后上传转写
      mediaRecorder.onstop = async () => {
        // 关闭麦克风流
        stream.getTracks().forEach((t) => t.stop())
        if (!chunks.length) return
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        try {
          // 调用后端语音转写接口
          const result = await transcribeSpeech(blob)
          if (result?.transcript) {
            // 拼接已有文本与转写结果
            liveText.value = [liveText.value, result.transcript].filter(Boolean).join('').trim()
          }
        } catch {
          error.value = '语音转写失败，请重试'
        }
        isListening.value = false
        useApiFallback = false
      }

      mediaRecorder.start()
      isListening.value = true
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        error.value = '麦克风权限被拒绝'
      } else {
        error.value = '无法访问麦克风'
      }
    }
  }

  // ==================== 公共方法 ====================

  /**
   * 开始录音
   * 优先尝试浏览器原生方案，失败时回退到 API 方案
   */
  function start() {
    error.value = ''
    useApiFallback = false
    shouldRestart = true

    // 优先尝试浏览器本地识别
    if (tryLocalStart()) {
      isListening.value = true
      return
    }
    // 不支持原生识别 → 直接用 API 方案
    isListening.value = true
    startApiRecording()
  }

  /** 停止录音并完成转写 */
  function stop() {
    shouldRestart = false
    // 关闭浏览器识别
    if (recognition) {
      try { recognition.abort() } catch { /* 忽略关闭异常 */ }
      recognition = null
    }
    // 关闭录音器
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    isListening.value = false
  }

  /**
   * 重置识别文本
   * @param {string} [value=''] - 重置后的值
   */
  function reset(value = '') {
    liveText.value = value
    error.value = ''
  }

  // 组件卸载时自动停止，避免泄漏
  onBeforeUnmount(() => stop())

  return { liveText, isListening, error, supported, start, stop, reset }
}
