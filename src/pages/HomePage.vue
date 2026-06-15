<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ArrowRight, Bot, GraduationCap, Mic, School, Sparkles, Users, FileText, TrendingUp } from 'lucide-vue-next'
import { roleCards } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'
import { ref, onMounted } from 'vue'

const router = useRouter()
const auth = useAuthStore()
const heroVisible = ref(false)

onMounted(() => {
  setTimeout(() => heroVisible.value = true, 100)
  if (auth.isAuthenticated.value) {
    const t = auth.user.value?.teacherType
    const home = { senior: '/senior/lesson', mid: '/mid/diagnosis', novice: '/novice/library' }
    if (t && home[t]) router.replace(home[t])
  }
})

/* 登录/注册 */
const roleOptions = [
  { key: 'senior', label: '老年资深教师', icon: Mic, color: '#D98C52' },
  { key: 'mid', label: '中年骨干教师', icon: Bot, color: '#3B82F6' },
  { key: 'novice', label: '新任青年教师', icon: GraduationCap, color: '#10B981' },
]
const selectedRole = ref('')
const isRegister = ref(false)
const username = ref('')
const password = ref('')
const regNickname = ref('')
const error = ref('')
const loading = ref(false)

async function doLogin() {
  error.value = ''
  if (!username.value.trim()) { error.value = '请输入账号'; return }
  if (!password.value) { error.value = '请输入密码'; return }
  if (!selectedRole.value) { error.value = '请选择身份'; return }
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    const home = { senior: '/senior/lesson', mid: '/mid/diagnosis', novice: '/novice/library' }
    router.push(home[selectedRole.value] || '/')
  } catch (e) { error.value = e?.message || '登录失败' }
  finally { loading.value = false }
}

async function doRegister() {
  error.value = ''
  if (!username.value.trim()) { error.value = '请输入账号'; return }
  if (!regNickname.value.trim()) { error.value = '请输入昵称'; return }
  if (!password.value) { error.value = '请输入密码'; return }
  if (!selectedRole.value) { error.value = '请选择身份'; return }
  loading.value = true
  try {
    await auth.register({ username: username.value.trim(), password: password.value, nickname: regNickname.value.trim(), teacherType: selectedRole.value })
    isRegister.value = false; error.value = ''; password.value = ''
  } catch (e) { error.value = e?.message || '注册失败' }
  finally { loading.value = false }
}
</script>

<template>
  <div class="ysd-ref-home">
    <header class="ysd-ref-nav">
      <RouterLink to="/" class="ysd-ref-brand">
        <span class="ysd-ref-brand-icon"><School :size="20" /></span>
        <strong>云师道</strong>
      </RouterLink>
    </header>

    <section class="home-main" :class="{ 'hero-visible': heroVisible }">
      <!-- 左侧品牌 -->
      <div class="home-hero">
        <h1>云师道<span class="text-accent">·</span>MathAgent</h1>
        <p class="home-subtitle">数智化助力乡村数学教育</p>
        <p class="home-desc">基于 AI 大模型的教学辅助平台，为乡村数学教师提供从备课、诊断到成长的完整工作流。</p>

        <div class="hero-visual-bg">
          <div class="hero-float-card card-1"><FileText :size="18" /><span>AI 智能备课</span></div>
          <div class="hero-float-card card-2"><TrendingUp :size="18" /><span>学情分析完成</span></div>
          <div class="hero-float-card card-3"><Users :size="18" /><span>3,200+ 教师在线</span></div>
          <div class="hero-float-card card-4"><Sparkles :size="18" /><span>错题智能诊断</span></div>
          <div class="hero-float-card card-5"><FileText :size="18" /><span>课题研究导航</span></div>
          <div class="hero-visual-core"><School :size="48" /></div>
        </div>
      </div>

      <!-- 右侧登录 -->
      <div class="home-login-card">
        <h2>{{ isRegister ? '注册' : '登录' }}</h2>
        <div class="role-cards">
          <button v-for="o in roleOptions" :key="o.key" type="button" class="role-card" :class="{ active: selectedRole === o.key }" :style="{ '--rc': o.color }" @click="selectedRole = o.key">
            <component :is="o.icon" :size="16" /><span>{{ o.label }}</span>
          </button>
        </div>
        <form @submit.prevent="isRegister ? doRegister() : doLogin()" class="auth-form">
          <input v-model="username" placeholder="账号（邮箱）" autocomplete="username" />
          <input v-if="isRegister" v-model="regNickname" placeholder="昵称" />
          <input v-model="password" type="password" placeholder="密码" />
          <p v-if="error" class="auth-error">{{ error }}</p>
          <button type="submit" class="auth-submit" :disabled="loading || !selectedRole">
            {{ loading ? '请稍候…' : (isRegister ? '注 册' : '登 录') }}
          </button>
        </form>
        <p class="auth-switch">
          <a href="#" @click.prevent="isRegister = !isRegister; error = ''">{{ isRegister ? '已有账号？登录' : '没有账号？注册' }}</a>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ===== PC 端左右布局 ===== */
.home-main { display: flex; align-items: center; justify-content: center; min-height: calc(100svh - 64px); padding: 40px 5vw; gap: 60px; max-width: 1100px; margin: 0 auto; }
.home-hero { flex: 1; min-width: 0; }
.home-hero h1 { font-size: 2.2rem; line-height: 1.3; margin-bottom: 8px; }
.home-hero h1 .text-accent { color: var(--primary-strong); }
.home-subtitle { font-size: 1.1rem; color: var(--primary-strong); font-weight: 600; margin-bottom: 12px; }
.home-desc { font-size: .92rem; color: var(--text-soft); line-height: 1.7; max-width: 440px; margin-bottom: 32px; }

/* 字条环绕 */
.hero-visual-bg { position: relative; width: 320px; height: 260px; margin: 0 auto; }
.hero-visual-core { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 72px; height: 72px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--primary), var(--primary-strong)); display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 6px 30px rgba(217,140,82,.3); animation: coreFloat 3s ease-in-out infinite; z-index: 2; }
@keyframes coreFloat { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translate(-50%, -50%) translateY(-6px); } }
.hero-float-card { position: absolute; background: var(--surface); border-radius: var(--radius-md); padding: 7px 12px; display: flex; align-items: center; gap: 5px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); font-size: .76rem; color: var(--text); font-weight: 500; opacity: 0; animation: floatCardIn .6s ease-out forwards; white-space: nowrap; z-index: 1; }
.hero-float-card.card-1 { top: 0; left: 50%; transform: translateX(-50%); animation-delay: .1s; color: var(--primary-strong); }
.hero-float-card.card-2 { top: 50px; right: -10px; animation-delay: .25s; color: #3B82F6; }
.hero-float-card.card-3 { bottom: 30px; right: -5px; animation-delay: .55s; color: #10B981; }
.hero-float-card.card-4 { bottom: 0; left: 50%; transform: translateX(-50%); animation-delay: .7s; color: #8B5CF6; }
.hero-float-card.card-5 { top: 50px; left: -10px; animation-delay: .4s; color: #EC4899; }
@keyframes floatCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.card-4 { animation-name: floatCardIn2; }
@keyframes floatCardIn2 { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }

.home-hero { opacity: 0; transform: translateY(24px); transition: all .6s ease-out; }
.hero-visible .home-hero { opacity: 1; transform: translateY(0); }

/* 登录卡片 */
.home-login-card { width: 380px; flex-shrink: 0; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-xl); padding: 36px 32px; box-shadow: var(--shadow); }
.home-login-card h2 { text-align: center; margin-bottom: 20px; font-size: 1.2rem; }
.role-cards { display: flex; gap: 6px; margin-bottom: 16px; }
.role-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 4px; border: 2px solid var(--border-light); border-radius: var(--radius-md); background: var(--surface); cursor: pointer; transition: all .2s; color: var(--text-soft); font-size: .76rem; font-weight: 500; }
.role-card:hover { border-color: var(--rc); }
.role-card.active { border-color: var(--rc); color: var(--rc); font-weight: 600; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.auth-form { display: grid; gap: 10px; }
.auth-form input { width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: .9rem; outline: none; transition: border .2s; }
.auth-form input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(217,140,82,.1); }
.auth-error { color: var(--danger); font-size: .8rem; margin: 0; text-align: center; }
.auth-submit { width: 100%; padding: 13px; border: none; border-radius: var(--radius-md); background: var(--primary); color: #fff; font-size: .95rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.auth-submit:hover { background: var(--primary-strong); }
.auth-submit:disabled { opacity: .5; cursor: not-allowed; }
.auth-switch { text-align: center; font-size: .82rem; margin-top: 4px; }
.auth-switch a { color: var(--primary-strong); }

/* ===== 移动端 ===== */
@media (max-width: 800px) {
  .home-main { flex-direction: column; gap: 32px; padding: 24px 20px 40px; min-height: auto; }
  .home-hero { text-align: center; }
  .home-hero h1 { font-size: 1.6rem; }
  .home-desc { margin-left: auto; margin-right: auto; }
  .home-login-card { width: 100%; max-width: 400px; }
}
@media (max-width: 640px) {
  .hero-visual-bg { width: 260px; height: 200px; }
  .hero-visual-core { width: 52px; height: 52px; }
  .hero-float-card { padding: 3px 7px; font-size: .6rem; gap: 2px; }
  .hero-float-card svg { width: 12px; height: 12px; }
  .hero-float-card.card-2 { top: 40px; right: -5px; }
  .hero-float-card.card-3 { bottom: 20px; right: -5px; }
  .hero-float-card.card-5 { top: 40px; left: -5px; }
}
</style>
