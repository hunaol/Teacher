/**
 * notification.js — 通知相关 API
 * ====================================================
 * 提供系统通知的获取和已读标记。
 */

import client from './client'

/**
 * 获取通知列表
 * @param {boolean} [unreadOnly] - 是否只拉取未读通知
 */
export function listNotifications(unreadOnly) {
  return client.get('/notifications', { params: { unreadOnly } })
}

/**
 * 将指定通知标记为已读
 * @param {string|number} id - 通知 ID
 */
export function markNotificationRead(id) {
  return client.post(`/notifications/${id}/read`)
}
