import { ref, computed } from 'vue'
import { TOKEN_KEY } from '../api/client'
import { login as loginApi, register as registerApi, getMe } from '../api/auth'

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(null)
const loading = ref(false)

const isAuthenticated = computed(() => !!token.value)

function setToken(value) {
  token.value = value
  if (value) {
    localStorage.setItem(TOKEN_KEY, value)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

async function login(username, password, teacherType) {
  loading.value = true
  try {
    const data = await loginApi(username, password, teacherType)
    setToken(data.token)
    user.value = data.user
    return data
  } finally {
    loading.value = false
  }
}

async function register(data) {
  loading.value = true
  try {
    return await registerApi(data)
  } finally {
    loading.value = false
  }
}

async function fetchUser() {
  if (!token.value) return
  loading.value = true
  try {
    user.value = await getMe()
  } catch {
    setToken('')
    user.value = null
  } finally {
    loading.value = false
  }
}

function logout() {
  setToken('')
  user.value = null
  window.location.hash = '#/'
}

export function useAuthStore() {
  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout,
  }
}
