import client from './client'

export function listVideos(tag) {
  return client.get('/teaching-library/videos', { params: tag ? { tag } : {} })
}

export function favoriteVideo(id) {
  return client.post(`/teaching-library/videos/${id}/favorite`)
}

export function watchVideo(id) {
  return client.post(`/teaching-library/videos/${id}/watched`)
}

export function uploadVideo(data) {
  return client.post('/teaching-library/videos', data)
}

export function updateVideo(id, data) {
  return client.put(`/teaching-library/videos/${id}`, data)
}

export function deleteVideo(id) {
  return client.delete(`/teaching-library/videos/${id}`)
}
