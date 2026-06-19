/**
 * AI 对话 API。
 * 模型密钥仅保存在后端；前端通过 fetch 读取 SSE 流并逐段回调。
 */

import { TOKEN_KEY } from './client.js'

const STREAM_URL = '/api/ai/avatar/chat/stream'
const TEACHER_TYPES = ['senior', 'mid', 'novice']

function currentTeacherType() {
  const hash = window.location.hash || ''
  const path = (hash.startsWith('#') ? hash.slice(1) : hash).split('?')[0]
  const prefix = path.split('/')[1]
  return TEACHER_TYPES.includes(prefix) ? prefix : ''
}

function requestHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' }
  const token = localStorage.getItem(TOKEN_KEY)
  const teacherType = currentTeacherType()
  if (token) headers.Authorization = `Bearer ${token}`
  if (teacherType) headers['X-Teacher-Type'] = teacherType
  return headers
}

async function responseError(response) {
  const body = await response.json().catch(() => null)
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.hash = '#/'
  }
  return new Error(body?.message || `请求失败 (${response.status})`)
}

function handleEvent(block, onChunk) {
  let event = 'message'
  const dataLines = []

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  if (!dataLines.length) return

  let data = {}
  try {
    data = JSON.parse(dataLines.join('\n'))
  } catch {
    throw new Error('后端返回了无法解析的流式数据')
  }

  if (event === 'delta' && data.content) onChunk(data.content)
  if (event === 'error') throw new Error(data.message || 'AI 回答生成失败')
}

async function consumeSse(body, onChunk) {
  const reader = body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        if (block.trim()) handleEvent(block, onChunk)
        boundary = buffer.indexOf('\n\n')
      }

      if (done) break
    }
    if (buffer.trim()) handleEvent(buffer, onChunk)
  } finally {
    reader.releaseLock()
  }
}

/**
 * 流式对话。每收到一段模型文本就调用一次 onChunk。
 */
export async function chatStream({ prompt, style, history = [], onChunk = () => {}, signal }) {
  const response = await fetch(STREAM_URL, {
    method: 'POST',
    headers: requestHeaders(),
    body: JSON.stringify({ prompt, style, history }),
    signal,
  })

  if (!response.ok) throw await responseError(response)
  if (!response.body) throw new Error('当前浏览器不支持流式响应')

  await consumeSse(response.body, onChunk)
}

/**
 * 非流式兼容入口，供现有页面继续使用。
 */
export async function chat(options) {
  let reply = ''
  await chatStream({
    ...options,
    onChunk: (chunk) => { reply += chunk },
  })
  return reply || '（未获取到回复）'
}

// API Key 是否可用由后端在请求时校验；保留此函数兼容旧调用方。
export function hasApiKey() {
  return true
}
