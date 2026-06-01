import client from './client'

export function generateLesson(requirement) {
  return client.post('/lessons/generate', { requirement })
}

export function listLessons() {
  return client.get('/lessons')
}

export function createLesson(data) {
  return client.post('/lessons', data)
}

export function updateLesson(id, data) {
  return client.put(`/lessons/${id}`, data)
}

export function createReflection(data) {
  return client.post('/reflections', data)
}

export function listReflections(lessonId) {
  return client.get('/reflections', { params: lessonId != null ? { lessonId } : {} })
}
