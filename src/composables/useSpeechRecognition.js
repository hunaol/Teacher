import { computed, onBeforeUnmount, ref } from 'vue'

export function useSpeechRecognition(options = {}) {
  const transcript = ref('')
  const interim = ref('')
  const isListening = ref(false)
  const error = ref('')

  let recognition = null

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function buildRecognition() {
    if (!supported) return null
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const instance = new SpeechRecognition()
    instance.lang = options.lang || 'zh-CN'
    instance.continuous = options.continuous ?? false
    instance.interimResults = options.interimResults ?? true
    instance.maxAlternatives = 1

    instance.onstart = () => {
      isListening.value = true
      error.value = ''
    }

    instance.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finalText += text
        else interimText += text
      }
      if (finalText) transcript.value = [transcript.value, finalText].filter(Boolean).join(' ').trim()
      interim.value = interimText.trim()
    }

    instance.onerror = (event) => {
      if (event.error === 'not-allowed') error.value = '麦克风权限被拒绝，请在浏览器中允许访问麦克风。'
      else if (event.error === 'network') error.value = '语音识别服务暂不可用，请稍后再试。'
      else error.value = `语音识别失败：${event.error}`
    }

    instance.onend = () => {
      isListening.value = false
      interim.value = ''
    }

    return instance
  }

  function start() {
    if (!supported) {
      error.value = '当前浏览器不支持语音识别，建议使用最新版 Edge 或 Chrome。'
      return false
    }
    if (!recognition) recognition = buildRecognition()
    recognition.start()
    return true
  }

  function stop() {
    recognition?.stop()
  }

  function reset(value = '') {
    transcript.value = value
    interim.value = ''
    error.value = ''
  }

  const liveText = computed(() => [transcript.value, interim.value].filter(Boolean).join(' ').trim())

  onBeforeUnmount(() => {
    recognition?.stop()
    recognition = null
  })

  return { transcript, interim, liveText, isListening, error, supported, start, stop, reset }
}
