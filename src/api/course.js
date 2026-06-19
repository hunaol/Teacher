/**
 * course.js — 课程相关 API
 * ====================================================
 * 提供课程列表、选课、学习进度上报等接口。
 */

import client from './client'

/**
 * 获取课程列表
 * @param {string} [audience] - 可选：按受众筛选（如 senior / mid / novice）
 * @returns {Promise<Array>} 课程列表
 */
export function listCourses(audience) {
  return client.get('/courses', { params: audience ? { audience } : {} })
}

/**
 * 选课（报名课程）
 * @param {string|number} id - 课程 ID
 */
export function enrollCourse(id) {
  return client.post(`/courses/${id}/enroll`)
}

/**
 * 上报学习进度
 * @param {string|number} id - 课程 ID
 * @param {Object} data - 进度数据（如完成度、当前章节等）
 */
export function updateCourseProgress(id, data) {
  return client.post(`/courses/${id}/progress`, data)
}
