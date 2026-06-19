<!--
  NovicePortfolioPage.vue — 新任教师"成长档案袋"
  ====================================================
  功能要点：
    1. 顶部统计：事件总数、本周新增、名师点评
    2. 月度热力图（35 格），根据事件密度按颜色等级渲染
    3. 新增成长记录（事件）、新增/查看名师点评
    4. 导出"成长成就墙"为 .txt 文本文件
-->
<script setup>
import { computed, ref, onMounted } from 'vue'
import { Download, Eye, Plus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import { getPortfolio, createEvent, listEvents, listFeedback, createFeedback } from '../api/growth'

/* ==================== 页面静态配置 ==================== */
const appName = '新任青年教师端'
const pageTitle = '成长档案袋'
const pageSubtitle = '自动汇总课堂实践、反馈与指导意见，并支持持续整理。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

/* ==================== 常量与工具函数 ==================== */
// 热力图等级颜色（从浅到深）
const levelColors = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81']
// 月份标签
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/** ISO 时间戳 → YYYY-MM-DD */
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 判断时间是否在最近 7 天内（用于"本周新增"统计） */
function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (isNaN(d.getTime())) return false
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return d >= weekAgo
}

/* ==================== 状态变量 ==================== */
const events = ref([])                  // 事件列表
const feedbacks = ref([])               // 反馈列表
const loading = ref(false)              // 列表加载态
const previewOpen = ref(false)          // 成就墙预览弹窗
const draft = ref('')                   // 新增事件草稿
const selectedMonth = ref(new Date().getMonth())  // 热力图当前月份
const allEvents = ref([])               // 全部事件（弹窗用）
const allEventsOpen = ref(false)        // 全部事件弹窗
const feedbackList = ref([])            // 反馈列表（弹窗用）
const feedbackOpen = ref(false)         // 反馈弹窗
const feedbackForm = ref({ title: '', content: '', feedbackType: 'mentor_comment', source: '' }) // 反馈表单

/** 顶部统计卡：事件总数 / 本周新增 / 名师点评 */
const derivedStats = computed(() => {
  const thisWeek = events.value.filter((e) => isThisWeek(e.eventTime)).length
  return [
    { label: '事件总数', value: String(events.value.length) },
    { label: '本周新增', value: String(thisWeek) },
    { label: '名师点评', value: String(feedbacks.value.length) },
  ]
})

/** 35 格热力图（5 行 × 7 列），每格表示一天的记录数 */
const calendarCells = computed(() => {
  const year = new Date().getFullYear()
  const month = selectedMonth.value + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  // 统计当月每天的记录数
  const dayCounts = new Map()
  events.value.forEach((e) => {
    if (!e.eventTime) return
    const d = new Date(e.eventTime)
    if (isNaN(d.getTime())) return
    if (d.getFullYear() === year && d.getMonth() === selectedMonth.value) {
      const day = d.getDate()
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
    }
  })
  return Array.from({ length: 35 }, (_, index) => {
    const day = index + 1
    if (day > daysInMonth) {
      return { key: `day-${day}`, day: '', count: 0, color: levelColors[0] }
    }
    const count = dayCounts.get(day) || 0
    return {
      key: `day-${day}`,
      day,
      count,
      color: levelColors[Math.min(count, levelColors.length - 1)],
    }
  })
})

/** 最近一次记录日期（按时间倒序） */
const lastRecordDate = computed(() => {
  const sorted = [...events.value].sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))
  return sorted[0] ? formatDate(sorted[0].eventTime) : '—'
})

/** 最近的 5 条事件 */
const recentEvents = computed(() =>
  [...events.value]
    .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))
    .slice(0, 5),
)

/** "成长成就墙"文本（用于预览与导出） */
const achievementWall = computed(() => {
  const lines = ['# 新任青年教师成长成就墙', '', `- 累计成长事件：${events.value.length}`]
  if (feedbacks.value.length) {
    lines.push('', '## 名师点评')
    feedbacks.value.forEach((f, i) => {
      const date = formatDate(f.createdAt)
      lines.push(`${i + 1}. ${date}｜${f.source || ''}：${f.content || ''}`)
    })
  }
  if (events.value.length) {
    lines.push('', '## 成长事件')
    events.value.forEach((e, i) => {
      const date = formatDate(e.eventTime)
      lines.push(`${i + 1}. ${date}｜${e.title || e.content || ''}`)
    })
  }
  return lines.join('\n')
})

/* ==================== 业务方法 ==================== */

/** 拉取成长档案（事件 + 反馈汇总） */
async function loadPortfolio() {
  loading.value = true
  try {
    const portfolio = await getPortfolio()
    events.value = portfolio.events || []
    feedbacks.value = portfolio.feedbacks || []
  } catch {
    // 拉取失败时使用空数组
    events.value = []
    feedbacks.value = []
  } finally {
    loading.value = false
  }
}

/** 新增一条成长记录（手动类型） */
async function addItem() {
  if (!draft.value.trim()) return
  try {
    await createEvent({
      eventType: 'manual',
      title: draft.value.trim(),
      content: draft.value.trim(),
    })
    draft.value = ''
    await loadPortfolio()
  } catch {
    // 静默
  }
}

/** 拉取并展示全部事件弹窗 */
async function loadAllEvents() {
  try { allEvents.value = await listEvents(); allEventsOpen.value = true } catch { /* */ }
}

/** 拉取并展示名师点评弹窗 */
async function loadFeedbackList() {
  try { feedbackList.value = await listFeedback(); feedbackOpen.value = true } catch { /* */ }
}

/** 提交新点评 */
async function submitFeedback() {
  if (!feedbackForm.value.title.trim()) return
  try {
    await createFeedback({
      title: feedbackForm.value.title.trim(),
      content: feedbackForm.value.content.trim(),
      feedbackType: feedbackForm.value.feedbackType,
      source: feedbackForm.value.source.trim() || undefined,
    })
    feedbackForm.value = { title: '', content: '', feedbackType: 'mentor_comment', source: '' }
    await loadPortfolio()
    await loadFeedbackList()
  } catch { /* */ }
}

// 初次挂载时拉取档案
onMounted(() => { loadPortfolio() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems"
    :theme="theme">
    <section class="feature-screen novice-portfolio-calendar-board">
      <div class="editor-card portfolio-calendar-main">
        <div class="panel-headline">
          <h3>{{ monthLabels[selectedMonth] }} 热力图</h3>
          <div class="choice-bar">
            <button class="choice-btn" @click="selectedMonth = Math.max(0, selectedMonth - 1)">‹ 上月</button>
            <button class="choice-btn" @click="selectedMonth = Math.min(11, selectedMonth + 1)">下月 ›</button>
          </div>
        </div>
        <div class="portfolio-week-head">
          <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="portfolio-calendar-grid">
          <article v-for="cell in calendarCells" :key="cell.key" class="portfolio-calendar-cell"
            :class="{ placeholder: cell.day === '' }" :style="{ background: cell.color }"><template
              v-if="cell.day !== ''"><strong>{{ cell.day }}</strong><small>{{ cell.count }} 条</small></template>
          </article>
        </div>
      </div>

      <div class="editor-card">
        <div class="panel-headline">
          <h3>新增记录</h3>
        </div>
        <textarea v-model="draft" rows="3" placeholder="写一条成长记录…"></textarea>
        <div class="bottom-action-bar">
          <UiButton @click="addItem">
            <Plus :size="16" /> 保存
          </UiButton>
        </div>
      </div>

      <div class="editor-card">
        <div class="panel-headline">
          <h3>成长里程碑</h3>
        </div>
        <div class="milestone-grid">
          <div class="milestone-item">
            <strong>{{ events.length }}</strong>
            <small>累计事件</small>
          </div>
          <div class="milestone-item">
            <strong>{{ feedbacks.length }}</strong>
            <small>名师点评</small>
          </div>
          <div class="milestone-item">
            <strong>{{ lastRecordDate }}</strong>
            <small>最近记录</small>
          </div>
        </div>
      </div>

      <div class="editor-card">
        <div class="panel-headline">
          <h3>最近记录</h3>
        </div>
        <div class="card-list">
          <article v-for="item in recentEvents" :key="item.id" class="data-card">
            <strong>{{ formatDate(item.eventTime) }}</strong>
            <p>{{ item.title || item.content }}</p>
          </article>
          <article v-if="!recentEvents.length" class="data-card">
            <p>暂无成长记录</p>
          </article>
        </div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="loadAllEvents">全部事件</UiButton>
          <UiButton variant="secondary" @click="loadFeedbackList">名师点评</UiButton>
          <UiButton variant="secondary" @click="previewOpen = true">
            <Eye :size="16" /> 预览全部
          </UiButton>
          <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(achievementWall)}`"
            download="成长成就墙.txt">
            <Download :size="16" /> 导出
          </UiButton>
        </div>
      </div>

      <UiDialog v-model:open="previewOpen" title="成长成就墙预览" description="">
        <div class="preview-paper">
          <pre>{{ achievementWall }}</pre>
        </div>
      </UiDialog>

      <UiDialog v-model:open="allEventsOpen" title="全部成长事件" description="">
        <div class="card-list">
          <article v-for="e in allEvents.slice(0, 30)" :key="e.id" class="data-card">
            <strong>{{ formatDate(e.eventTime) }} · {{ e.eventType }}</strong>
            <p>{{ e.title || e.content }}</p>
          </article>
          <p v-if="!allEvents.length">暂无事件</p>
        </div>
      </UiDialog>

      <UiDialog v-model:open="feedbackOpen" title="名师点评" description="">
        <div class="card-list">
          <article v-for="f in feedbackList" :key="f.id" class="data-card">
            <strong>{{ f.source || '未知' }} · {{ f.feedbackType }}</strong>
            <small>{{ formatDate(f.createdAt) }}</small>
            <p>{{ f.content }}</p>
          </article>
          <p v-if="!feedbackList.length">暂无点评</p>
        </div>
        <div class="editor-card" style="margin-top:12px">
          <h4>新增点评</h4>
          <input v-model="feedbackForm.title" placeholder="点评标题" />
          <input v-model="feedbackForm.source" placeholder="来源（如刘教授）" />
          <textarea v-model="feedbackForm.content" rows="3" placeholder="点评内容"></textarea>
          <div class="bottom-action-bar">
            <UiButton @click="submitFeedback">提交点评</UiButton>
          </div>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
