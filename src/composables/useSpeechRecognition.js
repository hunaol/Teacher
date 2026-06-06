import { ref, onBeforeUnmount } from 'vue'
import { transcribeSpeech } from '../api/speech'

export function useSpeechRecognition() {
  const liveText = ref('')
  const isListening = ref(false)
  const error = ref('')
  const supported = ref(true) // MediaRecorder 主流浏览器都支持

  let mediaRecorder = null
  let chunks = []

  async function start() {
    error.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      mediaRecorder = new MediaRecorder(stream, { mimeType })
      chunks = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (!chunks.length) return
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        try {
          const result = await transcribeSpeech(blob)
          if (result?.transcript) {
            liveText.value = [liveText.value, result.transcript].filter(Boolean).join(' ').trim()
          }
        } catch {
          error.value = '语音转写失败，请重试或使用上传音频'
        }
        isListening.value = false
      }

      mediaRecorder.start()
      isListening.value = true
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        error.value = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风，或使用上传音频。'
      } else {
        error.value = '无法访问麦克风，请使用上传音频转文字。'
      }
    }
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }

  function reset(value = '') {
    liveText.value = value
    error.value = ''
  }

  onBeforeUnmount(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  })

  return { liveText, isListening, error, supported, start, stop, reset }
}
