import client from './client'

export function getPortfolio() {
  return client.get('/growth/events/portfolio')
}

export function listEvents() {
  return client.get('/growth/events')
}

export function createEvent(data) {
  return client.post('/growth/events', data)
}

export function listFeedback(feedbackType) {
  return client.get('/growth/events/feedback', {
    params: feedbackType ? { feedbackType } : {},
  })
}

export function createFeedback(data) {
  return client.post('/growth/events/feedback', data)
}
