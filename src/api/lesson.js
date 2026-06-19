/**
 * lesson.js — 备课与教学反思相关 API
 * ====================================================
 * 包含教案生成、教案 CRUD、教学反思的增删查等接口。
 */

import client from './client'

/**
 * AI 生成教案
 * @param {string} requirement - 教师输入的备课需求/课题/学情
 * @returns {Promise<Object>} 生成的教案内容
 */
export function generateLesson(requirement) {
  return client.post('/lessons/generate', { requirement })
}

/** 获取当前教师的所有教案列表 */
export function listLessons() {
  return client.get('/lessons')
}

/**
 * 新建教案
 * @param {Object} data - 教案表单数据
 */
export function createLesson(data) {
  return client.post('/lessons', data)
}

/**
 * 更新指定教案
 * @param {string|number} id - 教案 ID
 * @param {Object} data - 待更新的字段
 */
export function updateLesson(id, data) {
  return client.put(`/lessons/${id}`, data)
}

/**
 * 新建教学反思
 * @param {Object} data - 反思内容（包含 lessonId 等）
 */
export function createReflection(data) {
  return client.post('/reflections', data)
}

/**
 * 获取教学反思列表
 * @param {string|number} [lessonId] - 可选：按教案 ID 过滤
 */
export function listReflections(lessonId) {
  return client.get('/reflections', { params: lessonId != null ? { lessonId } : {} })
}

/**
 * 删除指定教案
 * @param {string|number} id - 教案 ID
 */
export function deleteLesson(id) {
  return client.delete(`/lessons/${id}`)
}
