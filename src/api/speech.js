/**
 * speech.js — 语音转写相关 API
 * ====================================================
 * 将语音文件上传到后端进行 ASR 转写。
 */

import client from './client'

/**
 * 语音转写
 * @param {File} file - 音频文件
 * @param {string} [language] - 语言代码（如 'zh-CN'）
 * @param {string} [bizType] - 业务类型
 * @param {string|number} [bizId] - 业务对象 ID
 * @returns {Promise<Object>} 包含转写文本等结果
 */
export function transcribeSpeech(file, language, bizType, bizId) {
  // 构造 multipart/form-data 请求体
  const fd = new FormData()
  // 自定义文件名兜底，避免录音文件无 name 时后端无法识别扩展名
  fd.append('file', file, file.name || 'recording.webm')
  if (language) fd.append('language', language)
  if (bizType) fd.append('bizType', bizType)
  if (bizId) fd.append('bizId', bizId)
  return client.post('/speech/transcribe', fd)
}
