import client from './client'

export function recommendTopic(data) {
  return client.post('/research/topics/recommend', data)
}

export function listTopics() {
  return client.get('/research/topics')
}

export function saveTopic(data) {
  return client.post('/research/topics', data)
}

export function updateTopic(id, data) {
  return client.put(`/research/topics/${id}`, data)
}

export function deleteTopic(id) {
  return client.delete(`/research/topics/${id}`)
}
