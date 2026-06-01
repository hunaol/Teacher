import client from './client'

export function generateExperienceBook(data) {
  return client.post('/reports/experience-book', data || {})
}

export function generateAssessmentPackage(data) {
  return client.post('/reports/assessment-package', data || {})
}

export function generateGrowthReport(data) {
  return client.post('/reports/growth-report', data || {})
}
