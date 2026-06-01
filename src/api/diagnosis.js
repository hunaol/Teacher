import client from './client'

export function listDiagnosisStudents(className) {
  return client.get('/diagnoses/students', { params: className ? { className } : {} })
}

export function getStudentProfile(studentName, className) {
  return client.get(`/diagnoses/students/${encodeURIComponent(studentName)}`, {
    params: className ? { className } : {},
  })
}

export function createDiagnosis(data) {
  return client.post('/diagnoses', data)
}

export function uploadDiagnosisImage(file, fields = {}) {
  const formData = new FormData()
  formData.append('file', file)
  if (fields.studentName) formData.append('studentName', fields.studentName)
  if (fields.className) formData.append('className', fields.className)
  if (fields.subject) formData.append('subject', fields.subject)
  if (fields.topic) formData.append('topic', fields.topic)
  if (fields.questionText) formData.append('questionText', fields.questionText)
  if (fields.answerText) formData.append('answerText', fields.answerText)
  if (fields.imageNote) formData.append('imageNote', fields.imageNote)
  return client.post('/diagnoses/upload', formData)
}

export function archiveDiagnosis(id, note) {
  return client.post(`/diagnoses/${id}/archive`, note ? { note } : {})
}

export function listDiagnoses() {
  return client.get('/diagnoses')
}

export function getHeatmap(className, days) {
  return client.get('/diagnoses/heatmap', { params: { className, days } })
}
