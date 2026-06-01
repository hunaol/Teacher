<script setup>
import { computed, ref, onMounted } from 'vue'
import { Bookmark, BookmarkCheck, CheckCircle2, CirclePlay, ListTodo, MessageCircleMore, PlayCircle, Send, TvMinimalPlay } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { listVideos, favoriteVideo, watchVideo } from '../api/teaching-library'
import { createQuestion } from '../api/qa'
import { useRouter } from 'vue-router'

const router = useRouter()

const appName = '新任教师端'
const pageTitle = '本地名师经验库'
const pageSubtitle = '围绕乡村课堂常见问题，提供可收藏、可筛选的经验内容。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

function formatPlays(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(n)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mapVideo(r) {
  return {
    id: r.id,
    title: r.title || '',
    teacher: r.uploader || '',
    duration: r.duration || '',
    tags: r.tags ? r.tags.split(',').map((t) => t.trim()) : [],
    cover: r.coverUrl || `https://picsum.photos/seed/video-${r.id}/960/540`,
    plays: formatPlays(r.viewCount),
    uploader: r.uploader || '',
    date: formatDate(r.createdAt),
    description: r.summary || '',
    favorite: false,
  }
}

const videos = ref([])
const favorites = ref(new Set())
const watchedIds = ref(new Set())
const watchCount = ref(0)
const category = ref('热门')
const currentStage = ref(1)
const playingId = ref(null)
const questionDraft = ref('')
const qaOpen = ref(false)
const loading = ref(false)

const derivedStats = computed(() => ({
  title: pageTitle,
  subtitle: pageSubtitle,
  stats: [
    { label: '已收藏经验课', value: String(favorites.value.size) },
    { label: '视频总数', value: String(videos.value.length) },
    { label: '已学习', value: String(watchCount.value) },
  ],
}))

const workflow = computed(() => [
  { id: 1, title: '选视频', hint: '先点开一条经验视频。' },
  { id: 2, title: '收藏或提问', hint: '看完后收藏或发问。' },
  { id: 3, title: '提交问题', hint: '把问题发到答疑区。' },
])

const todoList = computed(() => [
  { id: '1', text: '打开经验视频', done: !!playingId.value },
  { id: '2', text: '完成收藏或提问', done: favorites.value.size > 0 || !!questionDraft.value },
  { id: '3', text: '提交问题', done: false },
])

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const categories = ['热门', '已收藏', '课堂管理', '提问设计', '活动组织']

const filteredVideos = computed(() => {
  if (category.value === '已收藏') return videos.value.filter((item) => favorites.value.has(item.id))
  if (category.value === '热门') return videos.value
  return videos.value.filter((item) =>
    item.tags.some((tag) => category.value.includes(tag) || tag.includes(category.value)),
  )
})

const featuredVideo = computed(() =>
  filteredVideos.value.find((item) => item.id === playingId.value)
  || filteredVideos.value[0]
  || videos.value[0],
)

async function loadVideos() {
  loading.value = true
  try {
    const list = await listVideos()
    videos.value = list.map(mapVideo)
    if (videos.value.length > 0) {
      playingId.value = videos.value[0].id
    }
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
}

async function playVideo(item) {
  playingId.value = item.id
  currentStage.value = 2
  try { await watchVideo(item.id); watchedIds.value.add(item.id); watchCount.value++ } catch { /* silent */ }
}

async function toggleFavorite(item) {
  const isFav = favorites.value.has(item.id)
  if (isFav) {
    favorites.value.delete(item.id)
    item.favorite = false
  } else {
    favorites.value.add(item.id)
    item.favorite = true
    try { await favoriteVideo(item.id) } catch { /* silent */ }
  }
  favorites.value = new Set(favorites.value)
  currentStage.value = 2
}

function openQaWithVideo(item) {
  playingId.value = item.id
  questionDraft.value = `我在看《${item.title}》时，想问：这个方法怎么迁移到自己的课堂？`
  qaOpen.value = true
  currentStage.value = 3
}

const submitting = ref(false)
const submitDone = ref(false)

async function submitQuestion() {
  if (!questionDraft.value.trim()) return
  submitting.value = true
  try {
    await createQuestion({
      content: questionDraft.value.trim(),
      sourceType: 'teaching_library_video',
      sourceId: playingId.value,
    })
    submitDone.value = true
    questionDraft.value = ''
    setTimeout(() => { submitDone.value = false; qaOpen.value = false }, 1500)
  } catch {
    // error
  } finally {
    submitting.value = false
  }
}

function goStage(id) { currentStage.value = id }

onMounted(() => { loadVideos() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats.stats" :nav-items="navItems" :theme="theme">
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
        <div class="workspace-panel-head"><strong>当前视频</strong><span class="header-channel">经验库</span></div>
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.title || '加载中' }}</span></li>
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.uploader || '' }}</span></li>
        </ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-video-platform">
      <section v-if="currentStage === 1" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>先选一条经验视频</h3></div></div>
        <div class="video-channel-bar">
          <button v-for="item in categories" :key="item" class="video-chip" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
        </div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="video-grid-feed">
          <article v-for="item in filteredVideos" :key="item.id" class="video-card-item">
            <div class="video-card-cover-wrap" @click="playVideo(item)"><img :src="item.cover" :alt="item.title" class="video-card-cover" /><span class="video-duration-tag"><CirclePlay :size="14" /> {{ item.duration }}</span></div>
            <div class="video-card-body"><strong>{{ item.title }}</strong><small>{{ item.uploader }}</small></div>
          </article>
          <p v-if="!filteredVideos.length" class="helper-copy">暂无经验视频。</p>
        </div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>{{ featuredVideo?.title || '' }}</h3></div><span class="status-pill"><TvMinimalPlay :size="14" /> {{ featuredVideo?.plays || '' }}</span></div>
        <div class="video-hero-card single-step-video-card">
          <div class="video-hero-cover-wrap"><img :src="featuredVideo?.cover" :alt="featuredVideo?.title" class="video-hero-cover" /><button class="video-play-mask"><PlayCircle :size="28" /><span>播放</span></button></div>
          <div class="video-hero-info"><strong>{{ featuredVideo?.title }}</strong><small>{{ featuredVideo?.uploader }} · {{ featuredVideo?.date }}<span v-if="featuredVideo && watchedIds.has(featuredVideo.id)" style="color:var(--primary-strong);margin-left:8px">✓ 已学习</span></small></div>
        </div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="toggleFavorite(featuredVideo)"><BookmarkCheck v-if="featuredVideo?.favorite" :size="16" /><Bookmark v-else :size="16" />{{ featuredVideo?.favorite ? '已收藏' : '收藏' }}</UiButton>
          <UiButton @click="openQaWithVideo(featuredVideo)"><MessageCircleMore :size="16" /> 下一步</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>提交问题</h3></div></div>
        <textarea v-model="questionDraft" rows="5"></textarea>
        <p v-if="submitDone" style="color:#059669;text-align:center;padding:8px">✓ 问题已提交，前往<a href="#/novice/qa" style="color:#4f46e5">答疑区</a>查看回复</p>
        <div v-else class="bottom-action-bar"><UiButton @click="submitQuestion" :disabled="submitting"><Send :size="16" /> {{ submitting ? '提交中…' : '提交问题' }}</UiButton></div>
      </section>

      <UiDialog v-model:open="qaOpen" title="提问" description="">
        <div class="preview-paper"><p>{{ questionDraft }}</p></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
