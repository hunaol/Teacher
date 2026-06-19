/**
 * authStore.js — 全局认证状态管理
 * ====================================================
 * 功能概述：
 *   1. 管理用户的登录态（token + user 资料）
 *   2. 将 token 持久化到 localStorage，刷新后自动恢复
 *   3. 提供登录、注册、获取当前用户、登出等核心鉴权操作
 *   4. 通过 useAuthStore() 工厂方法暴露给组件使用（单例）
 *
 * 设计模式：单例式状态（模块级 ref）
 *   模块首次加载时即创建一次，全应用共享同一份状态。
 */

// Vue 组合式 API：ref 用于定义响应式数据，computed 用于派生计算属性
import { ref, computed } from 'vue'

// 从全局 API 客户端中导入 token 在 localStorage 中的存储键名（避免硬编码）
import { TOKEN_KEY } from '../api/client'

// 导入鉴权相关的 API 请求方法
import {
  login as loginApi,      // 重命名：登录接口
  register as registerApi,// 重命名：注册接口
  getMe,                  // 获取当前登录用户信息
} from '../api/auth'

// ==================== 响应式状态 ====================

/**
 * 当前登录用户的 token（JWT）
 * 初始化时从 localStorage 读取已保存的 token，实现刷新页面保持登录态
 */
const token = ref(localStorage.getItem(TOKEN_KEY) || '')

/** 当前登录用户的资料对象（包含 id、username、role 等），未登录时为 null */
const user = ref(null)

/** 全局加载状态标识：用于登录/获取用户资料等异步操作时的 UI 状态 */
const loading = ref(false)

// ==================== 计算属性 ====================

/**
 * 派生：当前是否处于登录态
 * 根据 token 是否存在进行判断，比读取 user 更可靠
 * （因为部分场景下 token 存在但 user 还未拉取）
 */
const isAuthenticated = computed(() => !!token.value)

// ==================== 内部工具方法 ====================

/**
 * 设置 token 并同步到 localStorage
 * 传入空字符串时移除已保存的 token（用于登出场景）
 * @param {string} value - JWT token 字符串，传入空字符串表示清除
 */
function setToken(value) {
  token.value = value
  if (value) {
    // 登录成功：将 token 持久化到 localStorage
    localStorage.setItem(TOKEN_KEY, value)
  } else {
    // 登出或失效：清除本地存储的 token
    localStorage.removeItem(TOKEN_KEY)
  }
}

// ==================== 异步业务方法 ====================

/**
 * 用户登录
 * 1. 调用后端登录接口，传入用户名、密码、角色类型（教师类型）
 * 2. 登录成功后保存 token 并设置用户资料
 * 3. 返回完整的登录响应数据
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} teacherType - 教师类型（如'骨干'、'新入职'等）
 * @returns {Promise<Object>} 登录接口返回的数据
 */
async function login(username, password, teacherType) {
  loading.value = true
  try {
    const data = await loginApi(username, password, teacherType)
    setToken(data.token)  // 持久化 token
    user.value = data.user // 缓存用户资料
    return data
  } finally {
    // 无论成功还是失败都要关闭 loading 状态
    loading.value = false
  }
}

/**
 * 用户注册
 * 调用后端注册接口，不在此处自动登录（由调用方决定是否登录）
 * @param {Object} data - 注册表单数据
 * @returns {Promise<Object>} 注册接口返回的数据
 */
async function register(data) {
  loading.value = true
  try {
    return await registerApi(data)
  } finally {
    loading.value = false
  }
}

/**
 * 拉取当前登录用户的详细资料
 * - 没有 token 时直接返回（避免无效请求）
 * - 拉取失败（token 过期或无效）时自动清除登录态
 * 常用于页面刷新后恢复用户信息，或登录后补全用户资料
 */
async function fetchUser() {
  if (!token.value) return // 未登录时跳过
  loading.value = true
  try {
    user.value = await getMe()
  } catch {
    // token 已失效：清除登录态并重置 user
    setToken('')
    user.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 用户登出
 * 1. 清除本地 token 和用户资料
 * 2. 跳转到首页（hash 路由模式下的重定向）
 */
function logout() {
  setToken('')
  user.value = null
  // 使用 hash 模式跳转首页（与 Vue Router 配置保持一致）
  window.location.hash = '#/'
}

// ==================== 公共 API ====================

/**
 * 暴露给组件使用的认证 Store 工厂方法
 * 由于模块本身是单例的（ref 在模块加载时创建一次），
 * 多次调用 useAuthStore() 拿到的都是同一份响应式状态
 * @returns {Object} 包含 token、user、loading、isAuthenticated 及各个方法的对象
 */
export function useAuthStore() {
  return {
    // 响应式状态
    token,
    user,
    loading,
    isAuthenticated,
    // 业务方法
    login,
    register,
    fetchUser,
    logout,
  }
}
