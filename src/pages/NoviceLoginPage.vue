<!--
  NoviceLoginPage.vue — 新任教师登录页
  ====================================================
  与 LoginPage 类似，但角色固定为 'novice'：
    - 登录成功直接跳转到 /novice/library
    - 提供独立的注册入口（注册后切回登录态）
-->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { noviceApp } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
// 全局 authStore：login / register / loading 状态
const { login, register, loading } = useAuthStore()

/* ==================== 表单状态 ==================== */
const username = ref('')                       // 账号
const password = ref('')                       // 密码
const loginError = ref('')                     // 错误提示
const isRegister = ref(false)                  // 是否处于注册态
const regForm = ref({ nickname: '', teacherType: 'novice' }) // 注册表单

// 左侧亮点标签
const highlights = ['名师经验库', '在线答疑', '成长档案袋']

/** 登录：成功后跳转 /novice/library */
async function handleLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await login(username.value.trim(), password.value, 'novice')
    router.push('/novice/library')
  } catch (e) {
    loginError.value = e.message || '登录失败，请重试'
  }
}

/** 注册：注册成功后切回登录态 */
async function handleRegister() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await register({ username: username.value.trim(), password: password.value, nickname: regForm.value.nickname || undefined, teacherType: regForm.value.teacherType })
    isRegister.value = false; loginError.value = ''
  } catch (e) { loginError.value = e.message || '注册失败' }
}
</script>

<template>
  <div class="login-shell login-novice">
    <section class="login-layout-panel">
      <div class="login-side login-side-novice">
        <div class="login-side-top">
          <p class="page-eyebrow">新任青年教师端</p>
          <span class="header-chip subtle">启航型工作流</span>
        </div>
        <h1>帮助新教师更快建立稳定、清晰、可复制的课堂方法。</h1>
        <p>围绕经验学习、在线提问和成长记录，减少新任青年教师进入课堂后的试错成本，提升上手效率。</p>
        <div class="login-point-list">
          <span v-for="item in highlights" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ noviceApp.appName }}</p>
          <h2>{{ noviceApp.login.title }}</h2>
          <p class="login-subtitle">{{ noviceApp.login.subtitle }}</p>
          <form v-if="!isRegister" class="login-form-clean" @submit.prevent="handleLogin">
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">{{ loading ? '登录中…' : '进入工作区'
              }}</button>
            <p class="helper-copy" style="text-align:center"><a href="#"
                @click.prevent="isRegister = true; loginError = ''; username = ''; password = ''">没有账号？注册</a></p>
          </form>
          <form v-else class="login-form-clean" @submit.prevent="handleRegister">
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="new-password" />
            <input v-model="regForm.nickname" placeholder="昵称（选填）" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">{{ loading ? '注册中…' : '注册' }}</button>
            <p class="helper-copy" style="text-align:center"><a href="#"
                @click.prevent="isRegister = false; loginError = ''">已有账号？登录</a></p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
