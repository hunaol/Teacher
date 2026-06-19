/**
 * report.js — 报告生成相关 API
 * ====================================================
 * 经验集、评估包、成长报告等"大块文档"生成接口。
 */

import client from './client'

/**
 * 生成教师经验集
 * @param {Object} [data] - 经验集相关参数（可选）
 */
export function generateExperienceBook(data) {
  return client.post('/reports/experience-book', data || {})
}

/**
 * 生成课堂评估包
 * @param {Object} [data] - 评估包相关参数（可选）
 */
export function generateAssessmentPackage(data) {
  return client.post('/reports/assessment-package', data || {})
}

/**
 * 生成教师成长报告
 * @param {Object} [data] - 成长报告相关参数（可选）
 */
export function generateGrowthReport(data) {
  return client.post('/reports/growth-report', data || {})
}
