<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { midApp } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const { login, register, loading } = useAuthStore()

const username = ref('')
const password = ref('')
const loginError = ref('')
const isRegister = ref(false)
const regForm = ref({ nickname: '', teacherType: 'mid' })

const highlights = ['错题诊断', '数字助教', '课题研究导航']

async function handleLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await login(username.value.trim(), password.value)
    router.push('/mid/diagnosis')
  } catch (e) {
    loginError.value = e.message || '登录失败，请重试'
  }
}

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
  <div class="login-shell login-mid">
    <section class="login-layout-panel">
      <div class="login-side login-side-mid">
        <div class="login-side-top">
          <p class="page-eyebrow">骨干教师端</p>
          <span class="header-chip subtle">提升型工作流</span>
        </div>
        <h1>围绕课堂改进、互动支持和研究提升，形成更完整的教学闭环。</h1>
        <p>适合承担校本教研与课堂优化任务的教师，帮助分析学情、增强课堂互动并推进研究成果落地。</p>
        <div class="login-point-list">
          <span v-for="item in highlights" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ midApp.appName }}</p>
          <h2>{{ midApp.login.title }}</h2>
          <p class="login-subtitle">{{ midApp.login.subtitle }}</p>
          <form v-if="!isRegister" class="login-form-clean" @submit.prevent="handleLogin">
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">{{ loading ? '登录中…' : '进入工作区' }}</button>
            <p class="helper-copy" style="text-align:center"><a href="#" @click.prevent="isRegister=true;loginError='';username='';password=''">没有账号？注册</a></p>
          </form>
          <form v-else class="login-form-clean" @submit.prevent="handleRegister">
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="new-password" />
            <input v-model="regForm.nickname" placeholder="昵称（选填）" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">{{ loading ? '注册中…' : '注册' }}</button>
            <p class="helper-copy" style="text-align:center"><a href="#" @click.prevent="isRegister=false;loginError=''">已有账号？登录</a></p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
