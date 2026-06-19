/**
 * diagnosis.js — 错题诊断相关 API
 * ====================================================
 * 提供学生诊断信息查询、错题上传与分析、归档、热力图等接口。
 */

import client from './client'

/**
 * 获取诊断学生列表
 * @param {string} [className] - 可选：按班级过滤
 * @returns {Promise<Array>} 学生诊断列表
 */
export function listDiagnosisStudents(className) {
  return client.get('/diagnoses/students', { params: className ? { className } : {} })
}

/**
 * 获取单个学生的诊断画像详情
 * @param {string} studentName - 学生姓名
 * @param {string} [className] - 可选：班级
 */
export function getStudentProfile(studentName, className) {
  return client.get(`/diagnoses/students/${encodeURIComponent(studentName)}`, {
    params: className ? { className } : {},
  })
}

/**
 * 创建一条诊断记录（手动录入）
 * @param {Object} data - 诊断数据（学生、班级、题目等）
 */
export function createDiagnosis(data) {
  return client.post('/diagnoses', data)
}

/**
 * 上传错题图片并自动分析
 * @param {File} file - 错题图片文件
 * @param {Object} [fields] - 附带的元数据（学生、班级、知识点等）
 * @returns {Promise<Object>} 包含 rootCause（错因）和 interventions（改进建议）
 */
export function uploadDiagnosisImage(file, fields = {}) {
  // 构造 multipart/form-data 请求体
  const formData = new FormData()
  formData.append('file', file)
  if (fields.studentName) formData.append('studentName', fields.studentName)
  if (fields.className) formData.append('className', fields.className)
  if (fields.subject) formData.append('subject', fields.subject)
  if (fields.topic) formData.append('topic', fields.topic)
  if (fields.questionText) formData.append('questionText', fields.questionText)
  if (fields.answerText) formData.append('answerText', fields.answerText)
  if (fields.imageNote) formData.append('imageNote', fields.imageNote)
  return client.post('/diagnoses/upload', formData)
}

/**
 * 将诊断结果归档到学情档案
 * @param {string|number} id - 诊断 ID
 * @param {string} [note] - 归档备注
 */
export function archiveDiagnosis(id, note) {
  return client.post(`/diagnoses/${id}/archive`, note ? { note } : {})
}

/** 获取全部诊断记录（扁平列表） */
export function listDiagnoses() {
  return client.get('/diagnoses')
}

/**
 * 获取班级错题热力图数据
 * @param {string} [className] - 可选：按班级过滤
 * @param {number} [days] - 可选：按时间窗口（天）过滤
 */
export function getHeatmap(className, days) {
  return client.get('/diagnoses/heatmap', { params: { className, days } })
}

/** 获取诊断趋势数据 */
export function getTrend() {
  return client.get('/diagnoses/trend')
}

/**
 * 更新诊断记录
 * @param {string|number} id - 诊断 ID
 * @param {Object} data - 待更新的字段
 */
export function updateDiagnosis(id, data) {
  return client.put(`/diagnoses/${id}`, data)
}

/**
 * 删除诊断记录
 * @param {string|number} id - 诊断 ID
 */
export function deleteDiagnosis(id) {
  return client.delete(`/diagnoses/${id}`)
}
