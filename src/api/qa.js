/**
 * qa.js — 问答相关 API
 * ====================================================
 * 提供问题列表、提问、转发给导师、回复等接口。
 * 用于新教师与骨干教师之间的问答交流。
 */

import client from './client'

/**
 * 获取问题列表
 * @param {boolean} [mineOnly] - 是否只拉取当前教师的问题
 */
export function listQuestions(mineOnly) {
  return client.get('/qa/questions', {
    params: mineOnly ? { mineOnly: true } : {},
  })
}

/**
 * 提交一个新问题
 * @param {Object} data - 问题数据（标题、内容、标签等）
 */
export function createQuestion(data) {
  return client.post('/qa/questions', data)
}

/**
 * 将问题转发给指定导师
 * @param {string|number} id - 问题 ID
 * @param {string|number} [mentorUserId] - 导师用户 ID（不传则由后端分配）
 */
export function forwardQuestion(id, mentorUserId) {
  const params = mentorUserId ? { mentorUserId } : {}
  return client.post(`/qa/questions/${id}/forward`, null, { params })
}

/**
 * 回复某个问题
 * @param {string|number} id - 问题 ID
 * @param {Object} data - 回复内容
 */
export function replyToQuestion(id, data) {
  return client.post(`/qa/questions/${id}/replies`, data)
}
