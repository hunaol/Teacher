import client from './client'

export function listCourses(audience) {
  return client.get('/courses', { params: audience ? { audience } : {} })
}

export function enrollCourse(id) {
  return client.post(`/courses/${id}/enroll`)
}

export function updateCourseProgress(id, data) {
  return client.post(`/courses/${id}/progress`, data)
}
