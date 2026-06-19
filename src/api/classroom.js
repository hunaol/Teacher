/**
 * classroom.js — 班级/课堂素材相关 API
 * ====================================================
 * 提供班级素材列表、素材使用次数上报等接口。
 */

import client from './client'

/** 获取当前可用的课堂素材列表（如教具、PPT、动画等） */
export function listClassroomAssets() {
  return client.get('/classroom/assets')
}

/**
 * 上报素材使用情况（用于统计/推荐）
 * @param {string|number} assetId - 素材 ID
 */
export function useClassroomAsset(assetId) {
  return client.post(`/classroom/assets/${assetId}/use`)
}
