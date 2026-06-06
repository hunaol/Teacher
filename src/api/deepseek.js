const API_BASE = 'https://api.deepseek.com'

/* 在此填入你的 DeepSeek API Key */
const API_KEY = ''

export function hasApiKey() {
  return API_KEY.length > 0
}

export async function chat({ prompt, style, history = [] }) {
  if (!API_KEY) throw new Error('API Key 未配置，请在 src/api/deepseek.js 中填入')

  const systemPrompt = `你是乡村数学教学智能助手，服务对象是乡村学校骨干教师。
你的任务是根据教师的教学问题，提供可直接用于课堂的讲解建议、互动方案和教学策略。
回答要求：
- 语言简洁亲切，像经验丰富的同事在交流
- 结合乡村教学实际场景
- 给出具体可操作的建议，不要空泛理论
- 当前教师选择的教学风格是：${style}，请据此调整回答的语气和侧重点`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ]

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.8,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `请求失败 (${res.status})`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || '（未获取到回复）'
}
