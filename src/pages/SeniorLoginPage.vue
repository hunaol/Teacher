<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { seniorApp } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const { login, register, loading } = useAuthStore()

const username = ref('')
const password = ref('')
const loginError = ref('')
const isRegister = ref(false)
const regForm = ref({ nickname: '', teacherType: 'senior' })

const highlights = ['智能语音备课', '随堂反思', '案例沉淀']

async function handleLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await login(username.value.trim(), password.value)
    router.push('/senior/lesson')
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
    isRegister.value = false
    loginError.value = ''
  } catch (e) {
    loginError.value = e.message || '注册失败，请重试'
  }
}
</script>

<template>
  <div class="login-shell login-senior">
    <section class="login-layout-panel">
      <div class="login-side login-side-senior">
        <div class="login-side-top">
          <p class="page-eyebrow">资深教师端</p>
          <span class="header-chip subtle">经验型工作流</span>
        </div>
        <h1>把课堂经验沉淀成可复用的教案与教学记录。</h1>
        <p>面向长期扎根乡村课堂的教师，支持语音备课、课堂反思和案例积累，帮助经验持续转化。</p>
        <div class="login-point-list">
          <span v-for="item in highlights" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <div class="login-card-head">
            <p class="login-brand">{{ seniorApp.appName }}</p>
            <span class="login-state-dot"></span>
          </div>
          <h2>{{ seniorApp.login.title }}</h2>
          <p class="login-subtitle">{{ seniorApp.login.subtitle }}</p>
          <form v-if="!isRegister" class="login-form-clean" @submit.prevent="handleLogin">
            <label class="field-label">账号</label>
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <label class="field-label">密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">
              {{ loading ? '登录中…' : '进入工作区' }}
            </button>
            <p class="helper-copy" style="text-align:center"><a href="#" @click.prevent="isRegister=true;loginError='';username='';password=''">没有账号？注册</a></p>
          </form>
          <form v-else class="login-form-clean" @submit.prevent="handleRegister">
            <label class="field-label">账号</label>
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <label class="field-label">密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="new-password" />
            <label class="field-label">昵称</label>
            <input v-model="regForm.nickname" placeholder="选填" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">
              {{ loading ? '注册中…' : '注册' }}
            </button>
            <p class="helper-copy" style="text-align:center"><a href="#" @click.prevent="isRegister=false;loginError=''">已有账号？登录</a></p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
