import client from './client'

export function getExperienceBook() {
  return client.get('/experience/book')
}

export function shareExperience(data) {
  return client.post('/experience/share', data)
}

export function exportExperience(title) {
  return client.post('/experience/export', null, { params: title ? { title } : {} })
}
