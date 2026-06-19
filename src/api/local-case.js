/**
 * local-case.js — 本地案例相关 API
 * ====================================================
 * 乡村教师本地化教学案例的查询、创建、初始化。
 */

import client from './client'

/**
 * 获取本地案例列表
 * @param {Object} [params] - 查询参数（如学段、学科等）
 */
export function listLocalCases(params) {
  return client.get('/local-cases', { params })
}

/**
 * 创建本地案例
 * @param {Object} data - 案例数据
 */
export function createLocalCase(data) {
  return client.post('/local-cases', data)
}

/** 触发后端执行本地案例种子数据初始化（开发/演示用） */
export function seedLocalCases() {
  return client.post('/local-cases/seed')
}
