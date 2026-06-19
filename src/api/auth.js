/**
 * auth.js — 鉴权相关 API
 * ====================================================
 * 提供登录、注册、获取当前用户信息等接口方法。
 * 所有方法都基于 client.js 创建的 axios 实例，最终会被业务层调用。
 */

import client from './client'

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} teacherType - 教师类型（senior / mid / novice）
 * @returns {Promise<Object>} 接口返回的 { token, user, ... }
 */
export function login(username, password, teacherType) {
  return client.post('/auth/login', { username, password, teacherType })
}

/**
 * 用户注册
 * @param {Object} data - 注册表单数据（用户名、密码、角色、基础信息等）
 * @returns {Promise<Object>} 接口返回的注册结果
 */
export function register(data) {
  return client.post('/auth/register', data)
}

/**
 * 获取当前登录用户信息
 * 用于登录后或刷新页面后拉取最新用户资料
 * @returns {Promise<Object>} 当前用户对象
 */
export function getMe() {
  return client.get('/auth/me')
}
