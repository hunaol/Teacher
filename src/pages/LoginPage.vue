<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Mic, Bot, GraduationCap, Sparkles, School } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const { login, register, loading } = useAuthStore()

/* 根据 URL 路径推断默认身份 */
const pathRole = computed(() => {
  const p = route.path
  if (p.includes('senior')) return 'senior'
  if (p.includes('mid')) return 'mid'
  if (p.includes('novice')) return 'novice'
  return ''
})

const roleOptions = [
  { key: 'senior', label: '资深教师', icon: Mic, desc: '经验沉淀 · 教案迭代 · 反思追踪', color: '#D98C52' },
  { key: 'mid', label: '骨干教师', icon: Bot, desc: '课堂诊断 · AI 助教 · 课题研究', color: '#3B82F6' },
  { key: 'novice', label: '新任教师', icon: GraduationCap, desc: '名师经验 · 在线答疑 · 成长档案', color: '#10B981' },
]

const selectedRole = ref(pathRole.value || '')
const isRegister = ref(false)
const username = ref('')
const password = ref('')
const regNickname = ref('')
const error = ref('')

const currentRole = computed(() => roleOptions.find((r) => r.key === selectedRole.value))

async function doLogin() {
  error.value = ''
  if (!username.value.trim()) { error.value = '请输入账号'; return }
  if (!password.value) { error.value = '请输入密码'; return }
  if (!selectedRole.value) { error.value = '请选择身份'; return }
  try {
    await login(username.value.trim(), password.value)
    const home = { senior: '/senior/lesson', mid: '/mid/diagnosis', novice: '/novice/library' }
    router.push(home[selectedRole.value] || '/')
  } catch (e) { error.value = e?.message || '登录失败' }
}

async function doRegister() {
  error.value = ''
  if (!username.value.trim()) { error.value = '请输入账号'; return }
  if (!password.value) { error.value = '请输入密码'; return }
  if (!selectedRole.value) { error.value = '请选择身份'; return }
  try {
    await register({ username: username.value.trim(), password: password.value, nickname: regNickname.value.trim() || undefined, teacherType: selectedRole.value })
    isRegister.value = false
    error.value = ''
  } catch (e) { error.value = e?.message || '注册失败' }
}

const highlights = ['AI 智能备课', '错题诊断分析', '课题研究导航', '名师经验共享']
</script>

<template>
  <div class="login-shell">
    <section class="login-layout-panel">
      <!-- 左侧品牌 -->
      <div class="login-side">
        <div class="login-side-top">
          <School :size="28" style="color:var(--primary)" />
          <strong style="font-size:1.1rem">云师道 · MathAgent</strong>
        </div>
        <h1>乡村数学教师<br>多智能体赋能平台</h1>
        <div class="login-point-list">
          <span v-for="h in highlights" :key="h"><Sparkles :size="12" /> {{ h }}</span>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="login-card-panel">
        <div class="login-card-clean">
          <div class="login-card-head">
            <p class="login-brand">{{ isRegister ? '注册新账号' : '教师登录' }}</p>
            <span class="login-state-dot"></span>
          </div>

          <!-- 身份选择 -->
          <label class="field-label">教师身份</label>
          <div class="role-cards">
            <button
              v-for="o in roleOptions" :key="o.key"
              type="button"
              class="role-card"
              :class="{ active: selectedRole === o.key }"
              :style="{ '--rc': o.color }"
              @click="selectedRole = o.key"
            >
              <component :is="o.icon" :size="18" />
              <span>{{ o.label }}</span>
            </button>
          </div>

          <form v-if="!isRegister" class="login-form-clean" @submit.prevent="doLogin">
            <label class="field-label">账号</label>
            <input v-model="username" placeholder="请输入账号（邮箱）" autocomplete="username" />
            <label class="field-label">密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <p v-if="error" class="login-error">{{ error }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading || !selectedRole">
              {{ loading ? '登录中…' : '进入工作区' }}
            </button>
            <p class="helper-copy" style="text-align:center">
              <a href="#" @click.prevent="isRegister = true; error = ''">没有账号？去注册</a>
            </p>
            <p class="helper-copy" style="text-align:center;font-size:.72rem;color:var(--text-faint)">
              测试：senior_teacher@demo.cn / 123456
            </p>
          </form>

          <form v-else class="login-form-clean" @submit.prevent="doRegister">
            <label class="field-label">账号</label>
            <input v-model="username" placeholder="请输入账号（邮箱）" autocomplete="username" />
            <label class="field-label">昵称</label>
            <input v-model="regNickname" placeholder="如：李老师" />
            <label class="field-label">密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="new-password" />
            <p v-if="error" class="login-error">{{ error }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading || !selectedRole">
              {{ loading ? '注册中…' : '注册' }}
            </button>
            <p class="helper-copy" style="text-align:center">
              <a href="#" @click.prevent="isRegister = false; error = ''">已有账号？去登录</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.role-cards { display: flex; gap: 8px; margin-bottom: 8px; }
.role-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; border: 2px solid var(--border-light); border-radius: var(--radius-md); background: var(--surface); cursor: pointer; transition: all .2s; color: var(--text-soft); font-size: .82rem; font-weight: 500; }
.role-card:hover { border-color: var(--rc, var(--primary)); color: var(--text); }
.role-card.active { border-color: var(--rc, var(--primary)); color: var(--rc, var(--primary)); font-weight: 600; box-shadow: 0 0 0 3px rgba(217,140,82,.15); transform: translateY(-2px); }
</style>
