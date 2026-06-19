/**
 * profile.js — 个人资料与工作台相关 API
 * ====================================================
 * 提供个人资料获取/更新、首页工作台数据汇总。
 */

import client from './client'

/** 获取当前教师个人资料 */
export function getProfile() {
  return client.get('/profile')
}

/**
 * 更新个人资料
 * @param {Object} data - 资料字段（昵称、头像、简介等）
 */
export function updateProfile(data) {
  return client.put('/profile', data)
}

/** 获取首页工作台汇总数据（统计卡片、待办等） */
export function getDashboard() {
  return client.get('/profile/dashboard')
}
