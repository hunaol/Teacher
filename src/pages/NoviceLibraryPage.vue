<!--
  NoviceLibraryPage.vue — 新任教师"本地名师经验库"
  ====================================================
  功能要点：
    1. 视频列表浏览与分类筛选（热门 / 已收藏 / 课堂管理 / 提问设计 / 活动组织）
    2. 视频上传、编辑、删除、播放（统计观看次数）
    3. 收藏功能（持久化到 localStorage），并联动后端 favoriteVideo
    4. 提问：直接将问题提交至后端并跳转答疑页
    5. 左侧栏两步式工作流（浏览 → 收藏/提问）+ 工作清单勾选
-->
<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { Bookmark, BookmarkCheck, CheckCircle2, CirclePlay, ListTodo, MessageCircleMore, PlayCircle, Send, TvMinimalPlay } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { listVideos, favoriteVideo, watchVideo, uploadVideo, updateVideo, deleteVideo } from '../api/teaching-library'
import { uploadFile } from '../api/file'
import { createQuestion, replyToQuestion } from '../api/qa'
import { chat } from '../api/deepseek'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const currentUserId = computed(() => auth.user?.value?.id)

/* ==================== 页面静态配置 ==================== */
const appName = '新任青年教师端'
const pageTitle = '本地名师经验库'
const pageSubtitle = '围绕乡村课堂常见问题，提供可收藏、可筛选的经验内容。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

/* ==================== 工具函数 ==================== */

/** 播放量美化（>=10000 显示为 X.X 万） */
function formatPlays(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(n)
}

/** ISO 时间戳格式化为 MM-DD */
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 后端原始记录 → 视图模型的映射 */
function mapVideo(r) {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title || '',
    teacher: r.uploader || '',
    duration: r.duration || '',
    tags: r.tags ? r.tags.split(',').map((t) => t.trim()) : [],
    cover: r.coverUrl || '',
    mediaUrl: r.mediaUrl || '',
    plays: formatPlays(r.viewCount),
    uploader: r.uploader || '',
    date: formatDate(r.createdAt),
    description: r.summary || '',
    favorite: false,
  }
}

/* ==================== 收藏持久化（localStorage） ==================== */
const FAV_KEY = 'novice_library_favorites'
/** 从 localStorage 恢复收藏 ID 集合 */
function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')) } catch { return new Set() }
}
/** 将收藏 ID 集合写回 localStorage */
function saveFavorites(set) { localStorage.setItem(FAV_KEY, JSON.stringify([...set])) }

/* ==================== 状态变量 ==================== */
const videos = ref([])            // 视频列表
const favorites = ref(loadFavorites()) // 已收藏 ID 集合（同步 localStorage）
const watchedIds = ref(new Set()) // 已学习 ID 集合（本次会话内有效）
const watchCount = ref(0)         // 学习次数
const category = ref('热门')      // 当前分类
const currentStage = ref(1)       // 工作流步骤
const playingId = ref(null)       // 当前选中视频 ID
const questionDraft = ref('')     // 提问草稿
const qaOpen = ref(false)         // 提问弹窗（保留以兼容旧模板）
const loading = ref(false)        // 列表加载态

<<<<<<< HEAD
/* 上传视频 */
const uploadOpen = ref(false)
const uploadForm = ref({ title: '', summary: '', category: '课堂管理' })
const uploadFileEl = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadProgress = ref(0)
const uploadStage = ref('')
=======
/* ==================== 上传视频 ==================== */
const uploadOpen = ref(false)                                  // 上传弹窗显隐
const uploadForm = ref({ title: '', summary: '', category: '课堂管理' }) // 上传表单
const uploadFileEl = ref(null)                                // 文件 input 引用
const uploading = ref(false)                                  // 上传中
const uploadError = ref('')                                    // 上传错误提示
>>>>>>> cffdce0b3981f91c9ee230b0d2f7b4a90523b568

const categoryOptions = ['课堂管理', '提问设计', '活动组织', '其他']

/** 处理上传：先上传文件得到 URL，再调用后端接口写入视频元数据 */
async function handleUpload() {
  const file = uploadFileEl.value?.files?.[0]
  if (!file) { uploadError.value = '请选择视频文件'; return }
  if (!uploadForm.value.title.trim()) { uploadError.value = '请输入标题'; return }
  uploading.value = true
  uploadError.value = ''
  uploadProgress.value = 0
  uploadStage.value = '正在上传视频文件'
  try {
    const uploaded = await uploadFile(file, 'teaching_video', null, {
      onUploadProgress: (event) => {
        if (event.total) {
          uploadProgress.value = Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100)))
        } else if (uploadProgress.value === 0) {
          uploadProgress.value = 1
        }
      },
    })
    uploadProgress.value = 100
    uploadStage.value = '正在保存视频信息'
    await uploadVideo({
      title: uploadForm.value.title.trim(),
      summary: uploadForm.value.summary.trim(),
      category: uploadForm.value.category,
      mediaUrl: uploaded?.publicUrl || '',
      coverUrl: '',
      duration: '',
    })
    ElMessage.success('视频上传成功')
    uploadOpen.value = false
    uploadForm.value = { title: '', summary: '', category: '课堂管理' }
    uploadProgress.value = 0
    uploadStage.value = ''
    await loadVideos()
  } catch (e) {
    uploadError.value = e?.message || '上传失败'
  } finally {
    uploading.value = false
    if (!uploadError.value) uploadStage.value = ''
  }
}

<<<<<<< HEAD
const editOpen = ref(false)
const editingVideo = ref(null)
const editForm = ref({ title: '', summary: '', category: '' })
=======
/* ==================== 编辑/删除视频 ==================== */
const editOpen = ref(false)               // 编辑弹窗显隐
const editingVideo = ref(null)            // 当前编辑的视频
const editForm = ref({ title: '', summary: '', category: '' }) // 编辑表单
>>>>>>> cffdce0b3981f91c9ee230b0d2f7b4a90523b568

/** 打开编辑弹窗并填充表单 */
function openEdit(item) {
  editingVideo.value = item
  editForm.value = { title: item.title, summary: item.description || '', category: item.tags?.[0] || '其他' }
  editOpen.value = true
}

/** 提交编辑 */
async function handleEdit() {
  if (!editingVideo.value) return
  try {
    await updateVideo(editingVideo.value.id, editForm.value)
    ElMessage.success('视频已更新')
    editOpen.value = false
    await loadVideos()
  } catch { ElMessage.error('更新失败') }
}

/** 删除指定视频（带 confirm 二次确认） */
async function handleDeleteVideo(id) {
  if (!confirm('确定删除该视频？')) return
  try {
    await deleteVideo(id)
    ElMessage.success('视频已删除')
    await loadVideos()
  } catch { ElMessage.error('删除失败') }
}

/* ==================== 视频播放 ==================== */
const videoPlayerOpen = ref(false)    // 播放器弹窗
const playingVideoUrl = ref('')       // 正在播放的视频 URL
const playingVideoTitle = ref('')     // 正在播放的视频标题

/** 打开播放器：填入 URL、记录观看次数 */
function openPlayer(item) {
  playingVideoUrl.value = item.mediaUrl || ''
  playingVideoTitle.value = item.title
  videoPlayerOpen.value = true
  try { watchVideo(item.id); watchedIds.value.add(item.id); watchCount.value++ } catch { /* 静默失败 */ }
}

/** 顶部统计卡：已收藏 / 总数 / 已学习 */
const derivedStats = computed(() => ({
  title: pageTitle,
  subtitle: pageSubtitle,
  stats: [
    { label: '已收藏经验课', value: String(favorites.value.size) },
    { label: '视频总数', value: String(videos.value.length) },
    { label: '已学习', value: String(watchCount.value) },
  ],
}))

/** 左侧栏两步式工作流 */
const workflow = computed(() => [
  { id: 1, title: '浏览视频', hint: '选择并播放经验视频' },
  { id: 2, title: '收藏 & 提问', hint: '收藏优质视频并提交疑问' },
])

/** 工作清单（动态判定 done 状态） */
const todoList = computed(() => [
  { id: '1', text: '观看经验视频', done: watchCount.value > 0 },
  { id: '2', text: '收藏或提问', done: favorites.value.size > 0 || submitDone.value },
])

/** 当前工作流进度（百分比） */
const navProgress = computed(() => Math.round((currentStage.value / 2) * 100))

const categories = ['热门', '已收藏', '课堂管理', '提问设计', '活动组织']

/** 依据当前 category 过滤视频列表 */
const filteredVideos = computed(() => {
  if (category.value === '已收藏') return videos.value.filter((item) => favorites.value.has(item.id))
  if (category.value === '热门') return videos.value
  return videos.value.filter((item) =>
    item.tags.some((tag) => category.value.includes(tag) || tag.includes(category.value)),
  )
})

/** 详情页中"主推"视频：优先展示当前选中的，否则取第一项 */
const featuredVideo = computed(() =>
  filteredVideos.value.find((item) => item.id === playingId.value)
  || filteredVideos.value[0]
  || videos.value[0],
)

/** 拉取视频列表并合并收藏状态 */
async function loadVideos() {
  loading.value = true
  try {
    const list = await listVideos()
    videos.value = list.map((v) => {
      const video = mapVideo(v)
      video.favorite = favorites.value.has(video.id)
      return video
    })
    if (videos.value.length > 0) {
      playingId.value = videos.value[0].id
    }
  } catch {
    // 加载失败时静默处理
  } finally {
    loading.value = false
  }
}

/** 点击视频卡片：选中并切到第 2 步（同时上报观看） */
async function playVideo(item) {
  playingId.value = item.id
  currentStage.value = 2
  questionDraft.value = `我在看《${item.title}》时，想问：`
  try { await watchVideo(item.id); watchedIds.value.add(item.id); watchCount.value++ } catch { /* 静默 */ }
}

/** 切换收藏状态：本地立即更新，持久化，并联动后端 */
async function toggleFavorite(item) {
  const isFav = favorites.value.has(item.id)
  if (isFav) {
    favorites.value.delete(item.id)
    item.favorite = false
  } else {
    favorites.value.add(item.id)
    item.favorite = true
    try { await favoriteVideo(item.id) } catch { /* 静默 */ }
  }
  // 强制触发响应式
  favorites.value = new Set(favorites.value)
  saveFavorites(favorites.value)
  currentStage.value = 2
}

/** 打开与该视频关联的提问模板 */
function openQaWithVideo(item) {
  playingId.value = item.id
  questionDraft.value = `我在看《${item.title}》时，想问：这个方法怎么迁移到自己的课堂？`
  currentStage.value = 2
}

const submitting = ref(false)  // 提交中
const submitDone = ref(false)  // 是否已成功提交过

/** 提交问题到后端，提交成功后跳转到答疑页（带 AI 回复提示） */
async function submitQuestion() {
  if (!questionDraft.value.trim()) return
  submitting.value = true
  try {
    const created = await createQuestion({
      content: questionDraft.value.trim(),
      sourceType: 'teaching_library_video',
      sourceId: playingId.value,
    })
    const qid = created?.id
    const content = questionDraft.value.trim()
    submitDone.value = true
    questionDraft.value = ''
    /* 通过 sessionStorage 告诉 QaPage 哪个问题需要 AI 回复 */
    if (qid) sessionStorage.setItem('pending_ai_reply', qid)
    router.push('/novice/qa')
  } catch {
    // 失败时静默
  } finally {
    submitting.value = false
  }
}

/** 手动切换工作流步骤 */
function goStage(id) { currentStage.value = id }

// 初次挂载时拉取视频列表
onMounted(() => { loadVideos() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats.stats" :nav-items="navItems"
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
        <div class="workspace-panel-head"><strong>当前视频</strong><span class="header-channel">经验库</span></div>
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.title || '加载中' }}</span></li>
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.uploader || '' }}</span></li>
        </ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-video-platform">
      <section v-if="currentStage === 1" class="editor-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 1</p>
            <h3>先选一条经验视频</h3>
          </div>
          <UiButton variant="primary" @click="uploadOpen = true">上传视频</UiButton>
        </div>
        <div class="video-channel-bar">
          <button v-for="item in categories" :key="item" class="video-chip" :class="{ active: category === item }"
            @click="category = item">{{ item }}</button>
        </div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="video-grid-feed">
          <article v-for="item in filteredVideos" :key="item.id" class="video-card-item">
            <div class="video-card-cover-wrap" @click="playVideo(item)"><video v-if="item.mediaUrl" :src="item.mediaUrl"
                class="video-card-cover" preload="metadata" muted playsinline />
              <div v-else class="video-card-cover video-cover-fallback">
                <PlayCircle :size="28" />
              </div><span class="video-duration-tag">
                <CirclePlay :size="14" /> {{ item.duration || '视频' }}
              </span>
            </div>
            <div class="video-card-body">
              <strong>{{ item.title }}</strong>
              <small>{{ item.uploader }} · {{ item.date }}</small>
              <div v-if="item.userId === currentUserId" style="display:flex;gap:4px;margin-top:4px">
                <button class="choice-btn" style="font-size:.68rem;min-height:24px;padding:0 8px"
                  @click.stop="openEdit(item)">编辑</button>
                <button class="choice-btn" style="font-size:.68rem;min-height:24px;padding:0 8px;color:var(--danger)"
                  @click.stop="handleDeleteVideo(item.id)">删除</button>
              </div>
            </div>
          </article>
          <p v-if="!filteredVideos.length" class="helper-copy">暂无经验视频。</p>
        </div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">视频详情</p>
            <h3>{{ featuredVideo?.title || '' }}</h3>
          </div>
          <UiButton variant="ghost" size="sm" @click="currentStage = 1">返回列表</UiButton>
        </div>
        <div class="video-hero-card single-step-video-card">
          <div class="video-hero-cover-wrap"><video v-if="featuredVideo?.mediaUrl" :src="featuredVideo.mediaUrl"
              class="video-hero-cover" preload="metadata" muted playsinline />
            <div v-else class="video-hero-cover video-cover-fallback">
              <PlayCircle :size="40" />
            </div><button class="video-play-mask" @click="openPlayer(featuredVideo)">
              <PlayCircle :size="28" /><span>播放</span>
            </button>
          </div>
          <div class="video-hero-info"><strong>{{ featuredVideo?.title }}</strong><small>{{ featuredVideo?.uploader }} ·
              {{
                featuredVideo?.date }}<span v-if="featuredVideo && watchedIds.has(featuredVideo.id)"
                style="color:var(--primary-strong);margin-left:8px">✓ 已学习</span></small></div>
        </div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="toggleFavorite(featuredVideo)">
            <BookmarkCheck v-if="featuredVideo?.favorite" :size="16" />
            <Bookmark v-else :size="16" />{{ featuredVideo?.favorite ? '已收藏' : '收藏' }}
          </UiButton>
        </div>

        <!-- 提问区（直接在视频下方） -->
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-light)">
          <p class="hero-kicker">提出疑问</p>
          <textarea v-model="questionDraft" rows="3" placeholder="关于这个视频，你有什么疑问？" style="margin-bottom:8px"></textarea>
          <p v-if="submitDone" style="color:var(--success);text-align:center;padding:8px;font-size:.85rem">✓ 问题已提交，前往<a
              href="#/novice/qa" style="color:var(--primary);font-weight:600">答疑区</a>查看平台助理回复</p>
          <div v-else class="bottom-action-bar" style="border-top:none;padding-top:0">
            <UiButton @click="submitQuestion" :disabled="submitting || !questionDraft.trim()">
              <Send :size="14" /> {{ submitting ? '提交中…' : '提交问题' }}
            </UiButton>
          </div>
        </div>
      </section>

      <!-- 编辑视频弹窗 -->
      <UiDialog v-model:open="editOpen" title="编辑视频信息">
        <div class="upload-form">
          <div class="uf-field">
            <label class="field-label">视频标题</label>
            <input v-model="editForm.title" placeholder="视频标题" />
          </div>
          <div class="uf-field">
            <label class="field-label">视频简介</label>
            <textarea v-model="editForm.summary" rows="2" placeholder="简要描述…"></textarea>
          </div>
          <div class="uf-field">
            <label class="field-label">视频分类</label>
            <div class="category-pills">
              <button v-for="c in categoryOptions" :key="c" type="button" class="cat-pill"
                :class="{ active: editForm.category === c }" @click="editForm.category = c">{{ c }}</button>
            </div>
          </div>
          <UiButton @click="handleEdit" block variant="primary">保存修改</UiButton>
        </div>
      </UiDialog>

      <!-- 视频播放器 -->
      <UiDialog v-model:open="videoPlayerOpen" :title="playingVideoTitle" size="lg">
        <div v-if="playingVideoUrl"
          style="position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden">
          <video :src="playingVideoUrl" controls autoplay
            style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain" />
        </div>
        <p v-else class="helper-copy">视频地址无效</p>
      </UiDialog>

      <UiDialog v-model:open="qaOpen" title="提问" description="">
        <div class="preview-paper">
          <p>{{ questionDraft }}</p>
        </div>
      </UiDialog>

      <!-- 上传视频弹窗 -->
      <UiDialog v-model:open="uploadOpen" title="上传教学视频" size="lg">
        <div class="upload-form">
          <div class="upload-form-grid">
            <div class="uf-field">
              <label class="field-label">视频标题 <span class="required">*</span></label>
              <input v-model="uploadForm.title" placeholder="如：如何用方言讲解鸡兔同笼" />
            </div>
            <div class="uf-field">
              <label class="field-label">视频分类 <span class="required">*</span></label>
              <div class="category-pills">
                <button v-for="c in categoryOptions" :key="c" type="button" class="cat-pill"
                  :class="{ active: uploadForm.category === c }" @click="uploadForm.category = c">{{ c }}</button>
              </div>
            </div>
          </div>
          <div class="uf-field">
            <label class="field-label">视频简介</label>
            <textarea v-model="uploadForm.summary" rows="2" placeholder="简要描述视频内容和教学要点…"></textarea>
          </div>
          <div class="uf-field">
            <label class="field-label">视频文件 <span class="required">*</span></label>
            <div class="file-drop-zone" @click="uploadFileEl?.click()">
              <input type="file" ref="uploadFileEl" accept="video/*" style="display:none" @change="uploadError = ''" />
              <div class="file-drop-icon">📹</div>
              <p>点击选择视频文件</p>
              <small>支持 MP4、AVI、MOV 等格式</small>
            </div>
          </div>
          <div v-if="uploading" class="upload-progress">
            <UiProgress :value="uploadProgress" :label="uploadStage || '正在上传'" show-info />
          </div>
          <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
          <UiButton @click="handleUpload" :loading="uploading" block size="lg" variant="primary">
            {{ uploading ? '上传中…' : '确认上传' }}
          </UiButton>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>

<style scoped>
<<<<<<< HEAD
.upload-form { display: grid; gap: 16px; }
.upload-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.uf-field { display: grid; gap: 6px; }
.uf-field input, .uf-field textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: .9rem; outline: none; font-family: inherit; transition: border .2s; }
.uf-field input:focus, .uf-field textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(217,140,82,.1); }
.uf-field textarea { resize: vertical; }
.required { color: var(--danger); }
.category-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-pill { padding: 8px 14px; border: 1px solid var(--border-light); border-radius: var(--radius-full); background: var(--surface); font-size: .82rem; cursor: pointer; transition: all .2s; color: var(--text-soft); }
.cat-pill:hover { border-color: var(--primary); color: var(--primary); }
.cat-pill.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.file-drop-zone { border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 28px; text-align: center; cursor: pointer; transition: all .2s; background: var(--bg-soft); }
.file-drop-zone:hover { border-color: var(--primary); background: var(--primary-light); }
.file-drop-icon { font-size: 2rem; margin-bottom: 8px; }
.file-drop-zone p { font-size: .88rem; color: var(--text); margin: 0 0 4px; }
.file-drop-zone small { font-size: .75rem; color: var(--text-faint); }
.upload-progress { display: grid; gap: 6px; padding: 4px 0; }
.upload-error { color: var(--danger); font-size: .82rem; text-align: center; margin: 0; }
@media (max-width: 640px) { .upload-form-grid { grid-template-columns: 1fr; } }
=======
.upload-form {
  display: grid;
  gap: 16px;
}

.upload-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.uf-field {
  display: grid;
  gap: 6px;
}

.uf-field input,
.uf-field textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: .9rem;
  outline: none;
  font-family: inherit;
  transition: border .2s;
}

.uf-field input:focus,
.uf-field textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(217, 140, 82, .1);
}

.uf-field textarea {
  resize: vertical;
}

.required {
  color: var(--danger);
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-pill {
  padding: 8px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: .82rem;
  cursor: pointer;
  transition: all .2s;
  color: var(--text-soft);
}

.cat-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.cat-pill.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.file-drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  background: var(--bg-soft);
}

.file-drop-zone:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.file-drop-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.file-drop-zone p {
  font-size: .88rem;
  color: var(--text);
  margin: 0 0 4px;
}

.file-drop-zone small {
  font-size: .75rem;
  color: var(--text-faint);
}

.upload-error {
  color: var(--danger);
  font-size: .82rem;
  text-align: center;
  margin: 0;
}

@media (max-width: 640px) {
  .upload-form-grid {
    grid-template-columns: 1fr;
  }
}
>>>>>>> cffdce0b3981f91c9ee230b0d2f7b4a90523b568

/* 移动端适配 */
@media (max-width: 768px) {
  .single-step-video-card {
    max-width: 100%;
  }

  .video-hero-cover-wrap {
    aspect-ratio: 16/9;
  }

  .video-hero-info strong {
    font-size: .9rem;
  }

  .video-hero-info small {
    font-size: .75rem;
  }

  .video-card-body strong {
    font-size: .85rem;
  }
}

.video-card-cover {
  background: linear-gradient(160deg, #e8e0d5, #f0e8dc);
}

.video-hero-cover {
  background: linear-gradient(160deg, #e8e0d5, #f5efe6);
}

.video-cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, .15);
}

.video-cover-fallback span {
  color: #b8a088;
  font-size: 1rem;
  font-weight: 600;
}

@media (max-width: 480px) {
  .video-grid-feed {
    grid-template-columns: 1fr;
  }

  .video-card-cover-wrap {
    aspect-ratio: 16/9;
  }
}
</style>
