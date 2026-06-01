import client from './client'

export function listResources(params) {
  return client.get('/resources', { params })
}

export function likeResource(id) {
  return client.post(`/resources/${id}/like`)
}

export function favoriteResource(id) {
  return client.post(`/resources/${id}/favorite`)
}

export function createResource(data) {
  return client.post('/resources', data)
}

export function watchResource(id) {
  return client.post(`/resources/${id}/watched`)
}

export function reviewResource(id, auditStatus) {
  return client.post(`/resources/${id}/review`, null, { params: { auditStatus } })
}

export function listResourceComments(id) {
  return client.get(`/resources/${id}/comments`)
}

export function addResourceComment(id, data) {
  return client.post(`/resources/${id}/comments`, data)
}

export function listPendingAudit() {
  return client.get('/resources/audit/pending')
}
