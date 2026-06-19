/**
 * expert.js — 专家咨询/预约相关 API
 * ====================================================
 * 提供专家列表、专家咨询预约、预约管理等功能。
 */

import client from './client'

/**
 * 获取专家列表
 * @param {string} [field] - 可选：按学科/领域过滤
 */
export function listExperts(field) {
  return client.get('/experts', { params: field ? { field } : {} })
}

/**
 * 创建专家咨询预约
 * @param {Object} data - 预约信息（专家ID、时间、问题等）
 */
export function createAppointment(data) {
  return client.post('/experts/appointments', data)
}

/** 获取当前教师的预约列表 */
export function listAppointments() {
  return client.get('/experts/appointments')
}

/**
 * 更新指定预约（如改期、取消、补充说明）
 * @param {string|number} id - 预约 ID
 * @param {Object} data - 更新内容
 */
export function updateAppointment(id, data) {
  return client.post(`/experts/appointments/${id}`, data)
}
