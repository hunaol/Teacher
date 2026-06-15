import { ref, onBeforeUnmount } from 'vue'
import { transcribeSpeech } from '../api/speech'

export function useSpeechRecognition() {
  const liveText = ref('')
  const isListening = ref(false)
  const error = ref('')
  const supported = ref(true)

  let recognition = null
  let mediaRecorder = null
  let chunks = []
  let shouldRestart = false
  let useApiFallback = false

  /* ── 方案 A：浏览器本地 SpeechRecognition ── */
  function tryLocalStart() {
    const Klass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Klass) return false

    recognition = new Klass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'zh-CN'

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          liveText.value = liveText.value + event.results[i][0].transcript
        }
      }
    }

    recognition.onerror = (event) => {
      // network / service-not-allowed → Google 服务不可用，切换 API 方案
      if (event.error === 'network' || event.error === 'service-not-allowed') {
        useApiFallback = true
        stop()
        startApiRecording()
        return
      }
      if (event.error === 'not-allowed') {
        error.value = '麦克风权限被拒绝，请在浏览器设置中允许'
        isListening.value = false
      }
      // no-speech / aborted 静默处理
    }

    recognition.onend = () => {
      if (shouldRestart && recognition && !useApiFallback) {
        try { recognition.start(); return } catch { /* */ }
      }
      isListening.value = false
    }

    recognition.start()
    return true
  }

  /* ── 方案 B：MediaRecorder + 后端 API 转写 ── */
  async function startApiRecording() {
    error.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
      chunks = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (!chunks.length) return
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        try {
          const result = await transcribeSpeech(blob)
          if (result?.transcript) {
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

  function start() {
    error.value = ''
    useApiFallback = false
    shouldRestart = true

    // 优先尝试浏览器本地识别
    if (tryLocalStart()) {
      isListening.value = true
      return
    }
    // 不支持 → 直接用 API 方案
    isListening.value = true
    startApiRecording()
  }

  function stop() {
    shouldRestart = false
    if (recognition) {
      try { recognition.abort() } catch { /* */ }
      recognition = null
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    isListening.value = false
  }

  function reset(value = '') {
    liveText.value = value
    error.value = ''
  }

  onBeforeUnmount(() => stop())

  return { liveText, isListening, error, supported, start, stop, reset }
}
