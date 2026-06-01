import client from './client'

export function getProfile() {
  return client.get('/profile')
}

export function updateProfile(data) {
  return client.put('/profile', data)
}

export function getDashboard() {
  return client.get('/profile/dashboard')
}
