import client from './client'

export function listQuestions(mineOnly) {
  return client.get('/qa/questions', {
    params: mineOnly ? { mineOnly: true } : {},
  })
}

export function createQuestion(data) {
  return client.post('/qa/questions', data)
}

export function forwardQuestion(id, mentorUserId) {
  const params = mentorUserId ? { mentorUserId } : {}
  return client.post(`/qa/questions/${id}/forward`, null, { params })
}

export function replyToQuestion(id, data) {
  return client.post(`/qa/questions/${id}/replies`, data)
}
