import client from './client'

export function listLocalCases(params) {
  return client.get('/local-cases', { params })
}

export function createLocalCase(data) {
  return client.post('/local-cases', data)
}

export function seedLocalCases() {
  return client.post('/local-cases/seed')
}
