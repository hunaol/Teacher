import axios from 'axios'

const TOKEN_KEY = 'auth_token'
const DEFAULT_TIMEOUT = 30000
const UPLOAD_TIMEOUT = 10 * 60 * 1000

const client = axios.create({
  baseURL: '/api',
  timeout: DEFAULT_TIMEOUT,
})

const TEACHER_TYPES = ['senior', 'mid', 'novice']

function currentTeacherType() {
  const hash = window.location.hash || ''
  const path = (hash.startsWith('#') ? hash.slice(1) : hash).split('?')[0]
  const prefix = path.split('/')[1]
  return TEACHER_TYPES.includes(prefix) ? prefix : ''
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const teacherType = currentTeacherType()
  if (teacherType) {
    config.headers['X-Teacher-Type'] = teacherType
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body.code === 'number' && body.code !== 200) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body.data !== undefined ? body.data : null
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.hash = '#/'
    }
    const message = error.response?.data?.message || error.message || '网络异常'
    return Promise.reject(new Error(message))
  },
)

export { TOKEN_KEY }
export { UPLOAD_TIMEOUT }
export default client
