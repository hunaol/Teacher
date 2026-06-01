import client from './client'

export function listNotifications(unreadOnly) {
  return client.get('/notifications', { params: { unreadOnly } })
}

export function markNotificationRead(id) {
  return client.post(`/notifications/${id}/read`)
}
