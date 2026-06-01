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

const { user: currentUser } = useAuthStore()
const experts = ref([])
const mentorPickOpen = ref(false)
const selectedMentor = ref(null)
const imageUrl = ref('')
const imagePreview = ref('')
const uploadingImage = ref(false)

const appName = '新任教师端'
const pageTitle = '在线答疑'
const pageSubtitle = '围绕真实课堂问题，发起提问、编辑记录并追踪处理状态。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

function resolveName(userId, role) {
  if (userId === 0) return role || '系统'
  if (userId === currentUser.value?.id) return currentUser.value?.nickname || '我'
  return role || `用户${userId}`
}

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

function statusText(status) {
  if (status === 'answered') return '已回复'
  if (status === 'forwarded') return '已转发'
  return '待回复'
}

function parseContent(content) {
  const imgMatch = content?.match(/!\[.*?\]\((.*?)\)/)
  const imageUrl = imgMatch ? imgMatch[1] : ''
  const text = content?.replace(/!\[.*?\]\(.*?\)/, '').trim() || ''
  return { text, imageUrl }
}

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

const records = ref([])
const draft = ref('')
const loading = ref(false)
const replyDraft = ref('')
const replyingId = ref(null)
const currentStage = ref(1)

const derivedStats = computed(() => {
  const total = records.value.length
  const answered = records.value.filter((r) => r.role === '已回复').length
  return [
    { label: '待处理提问', value: String(total - answered) },
    { label: '已获得答复', value: String(answered) },
    { label: '本周互动', value: String(total) },
  ]
})

const workflow = computed(() => [
  { id: 1, title: '发动态', hint: '先写课堂问题。' },
  { id: 2, title: '看回复', hint: '看社区答疑。' },
  { id: 3, title: '转给名师', hint: '需要时再发给专家。' },
])

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const todoList = computed(() => [
  { id: '1', text: '写下问题', done: !!draft.value.trim() },
  { id: '2', text: '发布动态', done: records.value.some((r) => r.userId === currentUser.value?.id) },
  { id: '3', text: '查看回复', done: currentStage.value >= 2 },
])

async function loadQuestions() {
  loading.value = true
  try {
    const list = await listQuestions()
    records.value = list.map(mapQuestion)
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
}

async function submitQuestion() {
  if (!draft.value.trim()) return
  try {
    const payload = { content: draft.value.trim() }
    if (selectedMentor.value) payload.mentorUserId = selectedMentor.value.id
    if (imageUrl.value) payload.content = (payload.content || '') + '\n\n![图片](' + imageUrl.value + ')'
    await createQuestion(payload)
    draft.value = ''
    selectedMentor.value = null
    imageUrl.value = ''
    imagePreview.value = ''
    await loadQuestions()
    currentStage.value = 2
  } catch {
    // error
  }
}

async function openMentorPicker() {
  try { experts.value = await listExperts() } catch { /* */ }
  mentorPickOpen.value = true
}

function pickMentor(expert) {
  selectedMentor.value = expert
  mentorPickOpen.value = false
}

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

function removeImage() {
  imageUrl.value = ''
  imagePreview.value = ''
}

function goStage(id) { currentStage.value = id }

function startReply(id) { replyingId.value = id; replyDraft.value = '' }

async function submitReply(id) {
  if (!replyDraft.value.trim()) return
  try {
    await replyToQuestion(id, { content: replyDraft.value.trim() })
    replyDraft.value = ''
    replyingId.value = null
    await loadQuestions()
  } catch { /* error */ }
}

onMounted(() => { loadQuestions() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems" :theme="theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head"><ListTodo :size="16" /><strong>使用顺序</strong></div>
          <div class="bookmark-progress"><UiProgress :value="navProgress" label="当前步骤" /></div>
          <button v-for="item in workflow" :key="item.id" type="button" class="bookmark-item" :class="{ active: currentStage === item.id }" @click="goStage(item.id)">
            <span class="bookmark-index">{{ item.id }}</span>
            <div><strong>{{ item.title }}</strong><p>{{ item.hint }}</p></div>
          </button>
        </div>
        <div class="bookmark-card">
          <div class="bookmark-head"><CheckCircle2 :size="16" /><strong>工作清单</strong></div>
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }"><span class="todo-dot"></span><p>{{ todo.text }}</p></article>
        </div>
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>社区记录</strong><span class="header-channel">{{ records.length }} 条</span></div>
        <ul class="workspace-checklist"><li><span class="workspace-check"></span><span>先发动态，再看回复</span></li></ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-community-feed">
      <section v-if="currentStage === 1" class="editor-card community-compose-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>发动态</h3></div></div>
        <div class="community-compose-actions">
          <label class="community-inline-action" style="cursor:pointer;position:relative">
            <ImageIcon :size="16" /> {{ uploadingImage ? '上传中…' : imageUrl ? '已选图' : '配图' }}
            <input type="file" accept="image/*" class="hidden-file" @change="handleImageUpload" />
          </label>
          <button class="community-inline-action" @click="openMentorPicker">
            <UserRoundPlus :size="16" /> {{ selectedMentor ? '@' + selectedMentor.name : '@名师' }}
          </button>
          <span v-if="selectedMentor" style="font-size:.82rem;color:#4f46e5">{{ selectedMentor.title }} · {{ selectedMentor.field }}</span>
        </div>
        <img v-if="imagePreview" :src="imagePreview" style="max-width:200px;max-height:150px;border-radius:8px;margin-bottom:8px" />
        <textarea v-model="draft" rows="5" placeholder="描述你在课堂上遇到的具体问题…"></textarea>
        <div class="bottom-action-bar"><UiButton @click="submitQuestion"><Send :size="16" /> 发布</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>看回复</h3></div></div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="community-post-list">
          <article v-for="item in records" :key="item.id" class="community-post-card">
            <div class="community-post-head"><div class="community-avatar alt">{{ item.from.slice(0, 1) }}</div><div class="community-post-meta"><strong>{{ item.from }}</strong><small>{{ item.time }} · {{ item.role }}</small></div></div>
            <div class="community-post-copy"><span class="community-topic-tag"># {{ item.topic }}</span><p>{{ item.text }}</p><img v-if="item.imageUrl" :src="item.imageUrl" style="max-width:100%;max-height:300px;border-radius:8px;margin-top:6px" /></div>
            <div class="community-comment-box">
              <article v-for="reply in item.comments" :key="reply.id" class="community-comment-item"><strong>{{ reply.from }}</strong><p>{{ reply.text }}</p></article>
              <p v-if="!item.comments.length" class="helper-copy">暂无回复</p>
              <div v-if="replyingId === item.id" style="margin-top:8px">
                <textarea v-model="replyDraft" rows="2" placeholder="输入回复…"></textarea>
                <div class="bottom-action-bar"><UiButton @click="submitReply(item.id)">发送回复</UiButton></div>
              </div>
              <button v-else class="choice-btn" @click="startReply(item.id)" style="margin-top:6px">回复</button>
            </div>
          </article>
          <p v-if="!records.length" class="helper-copy">暂无问题，请先发布一条。</p>
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
