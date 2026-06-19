<!--
  NoviceQaPage.vue — 新任教师"在线答疑"
  ====================================================
  功能要点：
    1. 提问：支持配图、定向 @ 名师
    2. 自动触发"平台助理"AI 回复（deepseek/qwen chat 接口）
    3. 历史问答流式浏览、回复
    4. 与经验库联动：经验库提交问题后可携带 pending_ai_reply 标记跳转过来
    5. 左侧栏三步式工作流 + 工作清单
-->
<script setup>
import { computed, ref, onMounted } from 'vue'
import { CheckCircle2, Image as ImageIcon, ListTodo, Send, UserRoundPlus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { useAuthStore } from '../stores/authStore'
import { listQuestions, createQuestion, replyToQuestion } from '../api/qa'
import { listExperts } from '../api/expert'
import { uploadFile } from '../api/file'
import { chat } from '../api/deepseek'

const { user: currentUser } = useAuthStore()
const experts = ref([])                // 候选名师列表
const mentorPickOpen = ref(false)     // 名师选择弹窗
const selectedMentor = ref(null)      // 当前选中的名师
const imageUrl = ref('')              // 已上传图片的 URL（拼到 question content 中）
const imagePreview = ref('')          // 本地预览地址
const uploadingImage = ref(false)     // 图片上传中

/* ==================== 页面静态配置 ==================== */
const appName = '新任青年教师端'
const pageTitle = '在线答疑'
const pageSubtitle = '围绕真实课堂问题，发起提问、编辑记录并追踪处理状态。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

/* ==================== 工具函数 ==================== */

/** 解析显示用户名称：0=系统；自己=昵称；其他=回退展示 */
function resolveName(userId, role) {
  if (userId === 0) return role || '系统'
  if (userId === currentUser.value?.id) return currentUser.value?.nickname || '我'
  return role || `用户${userId}`
}

/** 时间格式化：今天显示 HH:MM，否则显示 MM-DD HH:MM */
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (isToday) return `今天 ${hh}:${mm}`
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`
}

/** 状态码 → 中文文案 */
function statusText(status) {
  if (status === 'answered') return '已回复'
  if (status === 'forwarded') return '已转发'
  return '待回复'
}

/** 解析 markdown 风格的图片语法 ![alt](url) */
function parseContent(content) {
  const imgMatch = content?.match(/!\[.*?\]\((.*?)\)/)
  const imageUrl = imgMatch ? imgMatch[1] : ''
  const text = content?.replace(/!\[.*?\]\(.*?\)/, '').trim() || ''
  return { text, imageUrl }
}

/** 后端问题记录 → 视图模型 */
function mapQuestion(q) {
  const parsed = parseContent(q.content)
  return {
    id: q.id,
    userId: q.userId,
    from: resolveName(q.userId, null),
    role: statusText(q.status),
    text: parsed.text || q.content,
    imageUrl: parsed.imageUrl,
    time: formatTime(q.createdAt),
    topic: q.topic || '课堂表达',
    comments: (q.replies || []).map((r) => {
      const rp = parseContent(r.content)
      return {
        id: r.id,
        userId: r.userId,
        from: resolveName(r.userId, r.role),
        text: rp.text || r.content,
        imageUrl: rp.imageUrl,
        role: r.role || '',
      }
    }),
  }
}

/* ==================== 状态变量 ==================== */
const records = ref([])            // 问题列表（视图模型）
const draft = ref('')              // 提问草稿
const loading = ref(false)         // 列表加载态
const replyDraft = ref('')         // 回复草稿
const replyingId = ref(null)       // 当前正在回复的问题 ID
const currentStage = ref(1)        // 工作流步骤

/** 顶部统计卡：待处理 / 已答复 / 本周互动 */
const derivedStats = computed(() => {
  const total = records.value.length
  const answered = records.value.filter((r) => r.role === '已回复').length
  return [
    { label: '待处理提问', value: String(total - answered) },
    { label: '已获得答复', value: String(answered) },
    { label: '本周互动', value: String(total) },
  ]
})

/** 左侧栏三步式工作流 */
const workflow = computed(() => [
  { id: 1, title: '写问题', hint: '描述课堂中遇到的具体困难。' },
  { id: 2, title: '看回复', hint: '查看社区老师的答疑。' },
  { id: 3, title: '@名师', hint: '定向请教专家教师。' },
])

/** 当前工作流进度 */
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

/** 工作清单 */
const todoList = computed(() => [
  { id: '1', text: '已发布问题', done: records.value.some((r) => r.userId === currentUser.value?.id) },
  { id: '2', text: '已获得回复', done: records.value.some((r) => r.role === '已回复') },
  { id: '3', text: '已@名师', done: !!selectedMentor.value },
])

/** 拉取问题列表 */
async function loadQuestions() {
  loading.value = true
  try {
    const list = await listQuestions()
    records.value = list.map(mapQuestion)
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

const aiReplying = ref(false)  // AI 是否正在回复

/**
 * 提交问题：
 *   1. 拼接图片 markdown 后调用 createQuestion
 *   2. 提交成功后清空草稿/图片/名师
 *   3. 刷新列表
 *   4. 触发"平台助理"AI 自动回复
 */
async function submitQuestion() {
  if (!draft.value.trim()) return
  try {
    const payload = { content: draft.value.trim() }
    if (selectedMentor.value) payload.mentorUserId = selectedMentor.value.id
    if (imageUrl.value) payload.content = (payload.content || '') + '\n\n![图片](' + imageUrl.value + ')'
    const created = await createQuestion(payload)
    const questionId = created?.id
    draft.value = ''
    selectedMentor.value = null
    imageUrl.value = ''
    imagePreview.value = ''
    await loadQuestions()

    /* 平台助理 AI 自动回复 */
    if (questionId) {
      aiReplying.value = true
      try {
        const aiReply = await chat({
          prompt: payload.content,
          style: '启发式教学',
          history: [],
        })
        await replyToQuestion(questionId, { content: aiReply, role: '平台助理' })
        await loadQuestions()
      } catch { /* AI 回复失败时静默 */ }
      aiReplying.value = false
    }
  } catch {
    // 静默
  }
}

/** 打开名师选择弹窗：先拉取名师列表 */
async function openMentorPicker() {
  try { experts.value = await listExperts() } catch { /* */ }
  mentorPickOpen.value = true
}

/** 选择名师并关闭弹窗 */
function pickMentor(expert) {
  selectedMentor.value = expert
  mentorPickOpen.value = false
}

/** 处理提问配图上传：先本地预览，再上传到后端获取 URL */
async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imagePreview.value = URL.createObjectURL(file)
  uploadingImage.value = true
  try {
    const result = await uploadFile(file, 'qa_question')
    imageUrl.value = result.publicUrl
  } catch { imagePreview.value = '' }
  finally { uploadingImage.value = false }
}

/** 移除已选图片 */
function removeImage() {
  imageUrl.value = ''
  imagePreview.value = ''
}

/** 切换工作流步骤 */
function goStage(id) { currentStage.value = id }

/** 展开某条问题的回复输入框 */
function startReply(id) { replyingId.value = id; replyDraft.value = '' }

/**
 * 提交回复：
 *   1. 调用 replyToQuestion
 *   2. 刷新列表
 *   3. 触发"平台助理"AI 跟进回复
 */
async function submitReply(id) {
  if (!replyDraft.value.trim()) return
  const userReply = replyDraft.value.trim()
  replyDraft.value = ''
  replyingId.value = null
  try { await replyToQuestion(id, { content: userReply }) } catch { /* */ }
  await loadQuestions()
  /* 平台助理自动跟进回复 */
  aiReplying.value = true
  try {
    const q = records.value.find((r) => r.id === id)
    const history = (q?.comments || []).map((c) => ({ role: c.role === '平台助理' ? 'assistant' : 'user', content: c.text }))
    const aiReply = await chat({ prompt: userReply, style: '启发式教学', history })
    await replyToQuestion(id, { content: aiReply, role: '平台助理' })
    await loadQuestions()
  } catch { /* */ }
  aiReplying.value = false
}

onMounted(async () => {
  await loadQuestions()
  /* 经验库提交问题后跳转过来时，触发该问题的 AI 回复 */
  const pendingQid = sessionStorage.getItem('pending_ai_reply')
  if (pendingQid) {
    sessionStorage.removeItem('pending_ai_reply')
    aiReplying.value = true
    try {
      const q = records.value.find((r) => r.id === Number(pendingQid))
      if (q) {
        const aiReply = await chat({ prompt: q.text, style: '启发式教学', history: [] })
        await replyToQuestion(Number(pendingQid), { content: aiReply, role: '平台助理' })
        await loadQuestions()
      }
    } catch { /* */ }
    aiReplying.value = false
  }
})
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems"
    :theme="theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head">
            <ListTodo :size="16" /><strong>使用顺序</strong>
          </div>
          <div class="bookmark-progress">
            <UiProgress :value="navProgress" label="当前步骤" />
          </div>
          <button v-for="item in workflow" :key="item.id" type="button" class="bookmark-item"
            :class="{ active: currentStage === item.id }" @click="goStage(item.id)">
            <span class="bookmark-index">{{ item.id }}</span>
            <div><strong>{{ item.title }}</strong>
              <p>{{ item.hint }}</p>
            </div>
          </button>
        </div>
        <div class="bookmark-card">
          <div class="bookmark-head">
            <CheckCircle2 :size="16" /><strong>工作清单</strong>
          </div>
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }"><span
              class="todo-dot"></span>
            <p>{{ todo.text }}</p>
          </article>
        </div>
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>社区记录</strong><span class="header-channel">{{ records.length }}
            条</span></div>
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>先发动态，再看回复</span></li>
        </ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-community-feed">
      <!-- 顶部：提问区 -->
      <section class="editor-card community-compose-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">发布问题</p>
            <h3>提出你的课堂疑问</h3>
          </div>
        </div>
        <div class="community-compose-actions">
          <label class="community-inline-action" style="cursor:pointer;position:relative">
            <ImageIcon :size="16" /> {{ uploadingImage ? '上传中…' : imageUrl ? '已选图' : '配图' }}
            <input type="file" accept="image/*" class="hidden-file" @change="handleImageUpload" />
          </label>
          <button class="community-inline-action" @click="openMentorPicker">
            <UserRoundPlus :size="16" /> {{ selectedMentor ? '@' + selectedMentor.name : '@名师' }}
          </button>
          <span v-if="selectedMentor" style="font-size:.82rem;color:var(--primary-strong)">{{ selectedMentor.title }} ·
            {{
              selectedMentor.field }}</span>
        </div>
        <img v-if="imagePreview" :src="imagePreview"
          style="max-width:200px;max-height:150px;border-radius:8px;margin-bottom:8px" />
        <textarea v-model="draft" rows="4" placeholder="描述你在课堂上遇到的具体问题…"></textarea>
        <div class="bottom-action-bar">
          <UiButton @click="submitQuestion">
            <Send :size="16" /> 发布
          </UiButton>
          <span v-if="aiReplying"
            style="font-size:.82rem;color:var(--primary-strong);display:flex;align-items:center;gap:6px">
            <span class="ai-dot"></span> 平台助理回复中…
          </span>
        </div>
      </section>

      <!-- 下方：历史问题列表 -->
      <section class="editor-card">
        <div class="panel-headline">
          <div>
            <h3>过往问题</h3>
          </div><span class="status-pill">{{ records.length }} 条</span>
        </div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="community-post-list">
          <article v-for="item in records" :key="item.id" class="community-post-card">
            <div class="community-post-head">
              <div class="community-avatar alt">{{ item.from.slice(0, 1) }}</div>
              <div class="community-post-meta"><strong>{{ item.from }}</strong><small>{{ item.time }} · {{ item.role
              }}</small></div>
            </div>
            <div class="community-post-copy">
              <span class="community-topic-tag"># {{ item.topic }}</span>
              <p>{{ item.text }}</p>
              <img v-if="item.imageUrl" :src="item.imageUrl"
                style="max-width:100%;max-height:300px;border-radius:8px;margin-top:6px" />
            </div>
            <div class="community-comment-box">
              <article v-for="reply in item.comments" :key="reply.id" class="community-comment-item"><strong>{{
                reply.from
              }}</strong>
                <p>{{ reply.text }}</p>
              </article>
              <p v-if="!item.comments.length" class="helper-copy">暂无回复</p>
              <div v-if="replyingId === item.id" style="margin-top:8px">
                <textarea v-model="replyDraft" rows="2" placeholder="输入回复…"></textarea>
                <div class="bottom-action-bar">
                  <UiButton @click="submitReply(item.id)">发送回复</UiButton>
                </div>
              </div>
              <button v-else class="choice-btn" @click="startReply(item.id)" style="margin-top:6px">回复</button>
            </div>
          </article>
          <p v-if="!records.length" class="helper-copy" style="padding:32px">暂无问题，请先发布一条。</p>
        </div>
      </section>

      <UiDialog v-model:open="mentorPickOpen" title="选择名师" description="">
        <div class="card-list">
          <article v-for="e in experts" :key="e.id" class="data-card" style="cursor:pointer" @click="pickMentor(e)">
            <strong>{{ e.name }}</strong><small>{{ e.title }} · {{ e.field }}</small>
            <p>{{ e.introduction?.slice(0, 80) || '' }}</p>
          </article>
          <p v-if="!experts.length">暂无可用名师</p>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>

<style scoped>
.ai-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: aiPulse 1s ease-in-out infinite;
}

@keyframes aiPulse {

  0%,
  100% {
    opacity: .3;
  }

  50% {
    opacity: 1;
  }
}
</style>
