/**
 * deepseek.js — AI 对话能力封装
 * ====================================================
 * 对接 OpenAI 兼容的大模型 Chat API（当前配置为阿里云千问 qwen-plus）。
 * 负责：
 *   1. 维护 API Key 与 baseURL
 *   2. 构造 system prompt（基于乡村教学场景和教师风格）
 *   3. 调用 chat/completions 接口并返回模型回复
 *
 * 注意：如需切换到 DeepSeek，只需修改 API_BASE 与 model 字段即可。
 */

// 模型服务的 OpenAI 兼容 API baseURL（当前：阿里云百炼）
const API_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

/* 在此填入你的 API Key（千问/DashScope 的 Key） */
const API_KEY = 'sk-ws-H.RPMHEEH.oqJ7.MEUCIHgG8yGgkzx1EmfWJ6xbfgFoF_pM-J2rdAWWMc3DlxfNAiEAj8ukyzLImC95d_YEglt9-UlDO7pWAwpCBrVfq2iOZMY'

/**
 * 检查是否已配置 API Key
 * @returns {boolean} true 表示已配置，false 表示未配置
 */
export function hasApiKey() {
  return API_KEY.length > 0
}

/**
 * 与模型进行单轮对话（支持传入历史消息）
 * @param {Object} options
 * @param {string} options.prompt - 用户当前输入的提示
 * @param {string} options.style - 教师当前选择的教学风格
 * @param {Array<{role: string, content: string}>} [options.history] - 历史消息
 * @returns {Promise<string>} 模型的回复内容
 */
export async function chat({ prompt, style, history = [] }) {
  if (!API_KEY) throw new Error('API Key 未配置，请在 src/api/deepseek.js 中填入')

  // 系统提示词：定义助手角色与回答风格
  const systemPrompt = `你是乡村数学教学智能助手，服务对象是乡村学校中年骨干教师。
你的任务是根据教师的教学问题，提供可直接用于课堂的讲解建议、互动方案和教学策略。
回答要求：
- 语言简洁亲切，像经验丰富的同事在交流
- 结合乡村教学实际场景
- 给出具体可操作的建议，不要空泛理论
- 当前教师选择的教学风格是：${style}，请据此调整回答的语气和侧重点`

  // 构造 messages：system + 历史（角色归一） + 当前 user
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
    { role: 'user', content: prompt },
  ]

  // 调用兼容 OpenAI 的 chat completions 接口
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus', // 千问模型；如切回 deepseek 可改为 'deepseek-chat'
      messages,
      temperature: 0.8,
      max_tokens: 2048,
    }),
  })

  // 错误处理：尝试解析后端返回的错误信息
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `请求失败 (${res.status})`)
  }

  // 解析响应数据，兼容空 choices
  const data = await res.json()
  return data.choices?.[0]?.message?.content || '（未获取到回复）'
}
