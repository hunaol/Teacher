import client from './client'

export function listExperts(field) {
  return client.get('/experts', { params: field ? { field } : {} })
}

export function createAppointment(data) {
  return client.post('/experts/appointments', data)
}

export function listAppointments() {
  return client.get('/experts/appointments')
}

export function updateAppointment(id, data) {
  return client.post(`/experts/appointments/${id}`, data)
}
