/**
 * growth.js — 教师成长档案相关 API
 * ====================================================
 * 提供成长事件（教研、培训、获奖等）的增删查与反馈功能。
 */

import client from './client'

/** 获取教师成长档案汇总（portfolio） */
export function getPortfolio() {
  return client.get('/growth/events/portfolio')
}

/** 获取成长事件列表 */
export function listEvents() {
  return client.get('/growth/events')
}

/**
 * 新增成长事件
 * @param {Object} data - 事件数据
 */
export function createEvent(data) {
  return client.post('/growth/events', data)
}

/**
 * 获取反馈列表
 * @param {string} [feedbackType] - 可选：按反馈类型过滤
 */
export function listFeedback(feedbackType) {
  return client.get('/growth/events/feedback', {
    params: feedbackType ? { feedbackType } : {},
  })
}

/**
 * 新增反馈
 * @param {Object} data - 反馈内容
 */
export function createFeedback(data) {
  return client.post('/growth/events/feedback', data)
}
