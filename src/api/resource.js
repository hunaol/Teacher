/**
 * resource.js — 资源库相关 API
 * ====================================================
 * 提供资源列表、点赞、收藏、发布、审核、评论等功能。
 */

import client from './client'

/**
 * 获取资源列表
 * @param {Object} [params] - 查询参数（学科、学段、关键词等）
 */
export function listResources(params) {
  return client.get('/resources', { params })
}

/**
 * 点赞资源
 * @param {string|number} id - 资源 ID
 */
export function likeResource(id) {
  return client.post(`/resources/${id}/like`)
}

/**
 * 收藏资源
 * @param {string|number} id - 资源 ID
 */
export function favoriteResource(id) {
  return client.post(`/resources/${id}/favorite`)
}

/**
 * 发布资源
 * @param {Object} data - 资源数据
 */
export function createResource(data) {
  return client.post('/resources', data)
}

/**
 * 标记资源为已观看（用于观看历史统计）
 * @param {string|number} id - 资源 ID
 */
export function watchResource(id) {
  return client.post(`/resources/${id}/watched`)
}

/**
 * 审核资源（管理员）
 * @param {string|number} id - 资源 ID
 * @param {string} auditStatus - 审核状态（approved / rejected）
 */
export function reviewResource(id, auditStatus) {
  return client.post(`/resources/${id}/review`, null, { params: { auditStatus } })
}

/**
 * 获取资源评论列表
 * @param {string|number} id - 资源 ID
 */
export function listResourceComments(id) {
  return client.get(`/resources/${id}/comments`)
}

/**
 * 给资源添加评论
 * @param {string|number} id - 资源 ID
 * @param {Object} data - 评论内容
 */
export function addResourceComment(id, data) {
  return client.post(`/resources/${id}/comments`, data)
}

/** 获取待审核资源列表（管理员） */
export function listPendingAudit() {
  return client.get('/resources/audit/pending')
}
