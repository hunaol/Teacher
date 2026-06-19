/**
 * client.js — Axios HTTP 客户端配置
 * ====================================================
 * 功能概述：
 *   1. 创建全局 axios 实例，统一 baseURL、超时等配置
 *   2. 暴露 token 在 localStorage 中存储的键名
 *   3. 请求拦截器：自动注入 token、识别教师类型
 *   4. 响应拦截器：统一处理业务码、401 登出、错误信息归一
 */

import axios from 'axios'

/** token 在 localStorage 中存储的键名（供整个应用引用，保持唯一） */
const TOKEN_KEY = 'auth_token'
const DEFAULT_TIMEOUT = 30000
const UPLOAD_TIMEOUT = 10 * 60 * 1000

// ==================== 基础配置 ====================

/**
 * 创建全局 axios 实例
 * - baseURL: '/api'（走 Vite 代理，转发到后端服务）
 * - timeout: 30 秒超时
 */
const client = axios.create({
  baseURL: '/api',
  timeout: DEFAULT_TIMEOUT,
})

// ==================== 内部工具：教师类型识别 ====================

/** 系统支持的三种教师类型（路由前缀） */
const TEACHER_TYPES = ['senior', 'mid', 'novice']

/**
 * 从当前 URL hash 中识别教师类型
 * 例如：#/senior/dashboard → 'senior'；#/mid/avatar → 'mid'
 * 用于在请求头中告诉后端当前访问者是哪一类教师
 * @returns {string} 教师类型字符串，未识别时返回空字符串
 */
function currentTeacherType() {
  const hash = window.location.hash || ''
  // 去掉开头的 '#' 和 query 参数，仅保留路径部分
  const path = (hash.startsWith('#') ? hash.slice(1) : hash).split('?')[0]
  const prefix = path.split('/')[1]
  return TEACHER_TYPES.includes(prefix) ? prefix : ''
}

// ==================== 请求拦截器 ====================

/**
 * 请求拦截器：
 *   1. 如果 localStorage 中有 token，则在请求头中追加 Authorization
 *   2. 根据当前 URL 识别教师类型，追加到 X-Teacher-Type 头
 */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  config.headers = config.headers || {}
  if (token) {
    // JWT Bearer 鉴权（与后端约定）
    config.headers.Authorization = `Bearer ${token}`
  }
  const teacherType = currentTeacherType()
  if (teacherType) {
    // 告诉后端当前教师类型（用于数据权限或返回内容区分）
    config.headers['X-Teacher-Type'] = teacherType
  }
  return config
})

// ==================== 响应拦截器 ====================

/**
 * 响应拦截器（成功）：
 *   1. 业务码非 200 时视为业务错误，reject 抛出 message
 *   2. 否则解包返回 data 字段（业务数据直接到达业务层）
 *
 * 响应拦截器（失败）：
 *   1. 401 状态码：清除本地 token 并跳转到首页（强登）
 *   2. 统一错误信息格式，reject 抛出
 */
client.interceptors.response.use(
  (response) => {
    const body = response.data
    // 业务状态码校验：非 200 视为业务异常
    if (body && typeof body.code === 'number' && body.code !== 200) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    // 兼容无 code 字段或无 data 字段的情况
    return body.data !== undefined ? body.data : null
  },
  (error) => {
    // 401 未授权：token 失效或过期，强制清除并跳首页
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.hash = '#/'
    }
    // 错误信息归一：优先取后端返回的 message，其次取 axios 的 message
    const message = error.response?.data?.message || error.message || '网络异常'
    return Promise.reject(new Error(message))
  },
)

// ==================== 模块导出 ====================

/** 导出 token 键名供其他模块使用（如 authStore） */
export { TOKEN_KEY }
export { UPLOAD_TIMEOUT }
/** 导出默认 axios 实例（其他 API 模块基于它发送请求） */
export default client
