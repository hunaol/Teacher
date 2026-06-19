/**
 * experience.js — 教师经验集相关 API
 * ====================================================
 * 提供经验集获取、分享、导出等接口。
 */

import client from './client'

/** 获取当前教师的经验集内容 */
export function getExperienceBook() {
  return client.get('/experience/book')
}

/**
 * 分享经验集内容（发布到经验社区）
 * @param {Object} data - 分享内容数据
 */
export function shareExperience(data) {
  return client.post('/experience/share', data)
}

/**
 * 导出经验集为文件
 * @param {string} [title] - 可选：导出文件的标题
 */
export function exportExperience(title) {
  return client.post('/experience/export', null, { params: title ? { title } : {} })
}
