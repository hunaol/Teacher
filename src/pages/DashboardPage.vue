<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboard } from '../api/profile'
import { listNotifications } from '../api/notification'
import { getPortfolio } from '../api/growth'

const router = useRouter()
const dashboard = ref(null)
const unreadCount = ref(0)
const recentEvents = ref([])

async function load() {
  try { dashboard.value = await getDashboard() } catch { /* */ }
  try { const ns = await listNotifications(true); unreadCount.value = ns.length } catch { /* */ }
  try { const p = await getPortfolio(); recentEvents.value = (p.events || []).slice(0, 5) } catch { /* */ }
}

function go(path) { router.push(path) }

onMounted(load)
</script>

<template>
  <div style="max-width:960px;margin:0 auto;padding:32px 24px">
    <h1 style="margin-bottom:24px">工作台</h1>

    <div v-if="dashboard" class="stats-ribbon" style="margin-bottom:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
      <div v-for="(v,k) in dashboard.counters" :key="k" class="data-card" style="text-align:center;padding:16px">
        <strong style="font-size:1.5rem;display:block;color:var(--primary-strong)">{{ v }}</strong>
        <small style="color:#6b7280">{{ k }}</small>
      </div>
    </div>

    <div class="card-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px">
      <div class="editor-card" @click="go('/profile')" style="cursor:pointer">
        <h3>个人中心</h3>
        <p>编辑个人资料、查看工作统计</p>
      </div>
      <div class="editor-card" @click="go('/reports')" style="cursor:pointer">
        <h3>报告中心</h3>
        <p>生成经验册PDF、考核材料、成长报告</p>
      </div>
      <div class="editor-card" @click="go('/cases')" style="cursor:pointer">
        <h3>乡土案例库</h3>
        <p>浏览和创建乡土教学案例</p>
      </div>
      <div class="editor-card" @click="go('/courses')" style="cursor:pointer">
        <h3>培训课程</h3>
        <p>报名和跟踪培训课程进度</p>
      </div>
      <div class="editor-card" @click="go('/experience')" style="cursor:pointer">
        <h3>经验册</h3>
        <p>查看教学经验、分享到教研库</p>
      </div>
      <div class="editor-card" @click="go('/files')" style="cursor:pointer">
        <h3>文件管理</h3>
        <p>上传和管理业务文件</p>
      </div>
    </div>

    <div v-if="recentEvents.length" class="editor-card">
      <h3>最近动态</h3>
      <div class="card-list">
        <article v-for="e in recentEvents" :key="e.id" class="data-card">
          <strong>{{ e.title }}</strong>
          <small>{{ e.eventType }} · {{ e.eventTime }}</small>
        </article>
      </div>
    </div>

    <p v-if="unreadCount" style="margin-top:12px;color:var(--primary-strong)">🔔 {{ unreadCount }} 条未读通知</p>
  </div>
</template>
