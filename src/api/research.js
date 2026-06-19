/**
 * research.js — 教研课题相关 API
 * ====================================================
 * 提供课题的 AI 推荐、列表查询、增删改等功能。
 */

import client from './client'

/**
 * 基于背景信息推荐教研课题
 * @param {Object} data - 推荐所需的背景（方向、学情等）
 */
export function recommendTopic(data) {
  return client.post('/research/topics/recommend', data)
}

/** 获取教研课题列表 */
export function listTopics() {
  return client.get('/research/topics')
}

/**
 * 保存（新建）一个教研课题
 * @param {Object} data - 课题数据
 */
export function saveTopic(data) {
  return client.post('/research/topics', data)
}

/**
 * 更新指定课题
 * @param {string|number} id - 课题 ID
 * @param {Object} data - 更新字段
 */
export function updateTopic(id, data) {
  return client.put(`/research/topics/${id}`, data)
}

/**
 * 删除指定课题
 * @param {string|number} id - 课题 ID
 */
export function deleteTopic(id) {
  return client.delete(`/research/topics/${id}`)
}
