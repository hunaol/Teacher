<script setup>
import { computed, ref } from 'vue'
import { Bookmark, BookmarkCheck, CheckCircle2, CirclePlay, ListTodo, MessageCircleMore, PlayCircle, Send, TvMinimalPlay } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { noviceApp } from '../mock/platformData'

const videos = ref(noviceApp.library.videos.map((item, index) => ({
  ...item,
  cover: `https://picsum.photos/seed/novice-video-${item.id}/960/540`,
  plays: ['1.2万', '8421', '6330', '1.6万'][index] || '5200',
  uploader: ['周海燕教研室', '乡村课堂实验班', '县域青年教师组', '桥头小学教研站'][index] || '平台精选',
  date: ['04-13', '04-12', '04-11', '04-10'][index] || '04-09',
  description: ['课堂冷场处理', '家乡素材融入', '合作学习组织', '低年级表达启动'][index] || '经验视频',
})))
const category = ref('热门')
const currentStage = ref(1)
const playingId = ref(videos.value[0]?.id ?? null)
const questionDraft = ref('')
const qaOpen = ref(false)

const workflow = computed(() => [
  { id: 1, title: '选视频', hint: '先点开一条经验视频。' },
  { id: 2, title: '收藏或提问', hint: '看完后收藏或发问。' },
  { id: 3, title: '提交问题', hint: '把问题发到答疑区。' },
])
const todoList = computed(() => [
  { id: '1', text: '打开经验视频', done: !!playingId.value },
  { id: '2', text: '完成收藏或提问', done: videos.value.some((item) => item.favorite) || !!questionDraft.value },
  { id: '3', text: '提交问题', done: false },
])
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))
const categories = ['热门', '课堂管理', '提问设计', '活动组织']
const filteredVideos = computed(() => videos.value.filter((item) => category.value === '热门' || item.tags.some((tag) => category.value.includes(tag) || tag.includes(category.value.replace('热门', '')))))
const featuredVideo = computed(() => videos.value.find((item) => item.id === playingId.value) || filteredVideos.value[0] || videos.value[0])

function playVideo(item) { playingId.value = item.id; currentStage.value = 2 }
function toggleFavorite(item) { item.favorite = !item.favorite; currentStage.value = 2 }
function openQaWithVideo(item) {
  playingId.value = item.id
  questionDraft.value = `我在看《${item.title}》时，想问：这个方法怎么迁移到自己的课堂？`
  qaOpen.value = true
  currentStage.value = 3
}
function submitQuestion() {
  if (!questionDraft.value.trim()) return
  questionDraft.value = ''
  qaOpen.value = false
}
function goStage(id) { currentStage.value = id }
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.library.title" subtitle="" :stats="noviceApp.library.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
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
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.title }}</span></li>
          <li><span class="workspace-check"></span><span>{{ featuredVideo?.uploader }}</span></li>
        </ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-video-platform">
      <section v-if="currentStage === 1" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>先选一条经验视频</h3></div></div>
        <div class="video-channel-bar">
          <button v-for="item in categories" :key="item" class="video-chip" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
        </div>
        <div class="video-grid-feed">
          <article v-for="item in filteredVideos" :key="item.id" class="video-card-item">
            <div class="video-card-cover-wrap" @click="playVideo(item)"><img :src="item.cover" :alt="item.title" class="video-card-cover" /><span class="video-duration-tag"><CirclePlay :size="14" /> {{ item.duration }}</span></div>
            <div class="video-card-body"><strong>{{ item.title }}</strong><small>{{ item.uploader }}</small></div>
          </article>
        </div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>{{ featuredVideo.title }}</h3></div><span class="status-pill"><TvMinimalPlay :size="14" /> {{ featuredVideo.plays }}</span></div>
        <div class="video-hero-card single-step-video-card">
          <div class="video-hero-cover-wrap"><img :src="featuredVideo.cover" :alt="featuredVideo.title" class="video-hero-cover" /><button class="video-play-mask"><PlayCircle :size="28" /><span>播放</span></button></div>
          <div class="video-hero-info"><strong>{{ featuredVideo.title }}</strong><small>{{ featuredVideo.uploader }} · {{ featuredVideo.date }}</small></div>
        </div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="toggleFavorite(featuredVideo)"><BookmarkCheck v-if="featuredVideo.favorite" :size="16" /><Bookmark v-else :size="16" />{{ featuredVideo.favorite ? '已收藏' : '收藏' }}</UiButton>
          <UiButton @click="openQaWithVideo(featuredVideo)"><MessageCircleMore :size="16" /> 下一步</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>提交问题</h3></div></div>
        <textarea v-model="questionDraft" rows="5"></textarea>
        <div class="bottom-action-bar"><UiButton @click="submitQuestion"><Send :size="16" /> 提交问题</UiButton></div>
      </section>

      <UiDialog v-model:open="qaOpen" title="提问" description="">
        <div class="preview-paper"><p>{{ questionDraft }}</p></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
