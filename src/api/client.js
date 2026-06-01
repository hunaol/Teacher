import axios from 'axios'

const TOKEN_KEY = 'auth_token'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
export default client
