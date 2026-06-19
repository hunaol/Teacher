/**
 * teaching-library.js — 教学视频库相关 API
 * ====================================================
 * 提供视频列表、收藏、观看上报、增删改等接口。
 */

import client from './client'

/**
 * 获取视频列表
 * @param {string} [tag] - 可选：按标签过滤
 */
export function listVideos(tag) {
  return client.get('/teaching-library/videos', { params: tag ? { tag } : {} })
}

/**
 * 收藏视频
 * @param {string|number} id - 视频 ID
 */
export function favoriteVideo(id) {
  return client.post(`/teaching-library/videos/${id}/favorite`)
}

/**
 * 标记视频为已观看
 * @param {string|number} id - 视频 ID
 */
export function watchVideo(id) {
  return client.post(`/teaching-library/videos/${id}/watched`)
}

/**
 * 上传新视频
 * @param {Object} data - 视频元数据
 */
export function uploadVideo(data) {
  return client.post('/teaching-library/videos', data)
}

/**
 * 更新视频信息
 * @param {string|number} id - 视频 ID
 * @param {Object} data - 更新字段
 */
export function updateVideo(id, data) {
  return client.put(`/teaching-library/videos/${id}`, data)
}

/**
 * 删除视频
 * @param {string|number} id - 视频 ID
 */
export function deleteVideo(id) {
  return client.delete(`/teaching-library/videos/${id}`)
}
