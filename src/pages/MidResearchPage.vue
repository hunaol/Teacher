<script setup>
import { computed, ref, watch } from 'vue'
import { BookPlus, CheckCircle2, FileBadge2, Files, ListTodo, LockKeyhole, Search, Send, Telescope } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { midApp } from '../mock/platformData'

const TOPIC_LIBRARY_KEY = 'mid-research-topic-library'
const categoryList = ['全部', '语文', '数学', '综合实践', '科学']
const schoolList = ['桥头小学', '河西小学', '南岭实验校', '东山教学点']
const titleSeeds = ['乡土案例融入语文表达课设计','分层提问支持下的数学错题讲评','综合实践中的本地资源观察记录','低年级课堂表达启动方案','实验记录单优化与科学探究课','小组合作规则建立教案']

function createDocLibrary() {
  return Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    title: `${titleSeeds[index % titleSeeds.length]}（样本 ${index + 1}）`,
    subject: categoryList[(index % (categoryList.length - 1)) + 1],
    grade: `${['三', '四', '五', '六'][index % 4]}年级`,
    school: schoolList[index % schoolList.length],
    updatedAt: `2026-04-${String((index % 22) + 1).padStart(2, '0')}`,
    summary: ['课堂实录 + 活动结构', '错题讲评 + 反馈策略', '案例资源 + 观察单'][index % 3],
    selected: index < 4,
  }))
}
function loadTopicLibrary() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(TOPIC_LIBRARY_KEY) || '[]')
  } catch {
    return []
  }
}

const docLibrary = ref(createDocLibrary())
const topicLibrary = ref(loadTopicLibrary())
const selectedTopic = ref({ ...midApp.research.list[0], transformed: false, createdAt: '', sources: [] })
const keyword = ref('')
const category = ref('全部')
const dataAuthorized = ref(false)
const activeTopicId = ref(topicLibrary.value[0]?.id ?? null)
const currentStage = ref(1)
const expertOpen = ref(false)

watch(topicLibrary, (value) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOPIC_LIBRARY_KEY, JSON.stringify(value))
}, { deep: true })

const filteredDocs = computed(() => {
  const value = keyword.value.trim()
  return docLibrary.value.filter((item) => {
    const matchCategory = category.value === '全部' || item.subject === category.value
    const matchKeyword = !value || `${item.title}${item.subject}${item.grade}${item.school}${item.summary}`.includes(value)
    return matchCategory && matchKeyword
  })
})
const selectedDocs = computed(() => docLibrary.value.filter((item) => item.selected))
const activeTopic = computed(() => topicLibrary.value.find((item) => item.id === activeTopicId.value) ?? null)
const navProgress = computed(() => Math.round((currentStage.value / 4) * 100))
const workflow = computed(() => [
  { id: 1, title: '授权数据', hint: '先开启案例授权。' },
  { id: 2, title: '选教案', hint: '从文档库选择来源。' },
  { id: 3, title: '建课题', hint: '生成建议并创建课题。' },
  { id: 4, title: '我的课题库', hint: '随时打开查看。' },
])
const todoList = computed(() => [
  { id: '1', text: '完成案例授权', done: dataAuthorized.value },
  { id: '2', text: '选择教案来源', done: !!selectedDocs.value.length },
  { id: '3', text: '创建课题', done: !!topicLibrary.value.length },
])
const recommendationState = computed(() => dataAuthorized.value ? '已生成结构化推荐' : '等待授权')
const topicSummary = computed(() => `${selectedTopic.value.title}\n\n${selectedTopic.value.meta}\n\n${selectedTopic.value.extra}\n\n来源教案：\n${selectedDocs.value.length ? selectedDocs.value.map((item) => `- ${item.title}`).join('\n') : '- 暂未选择'}`)

function goStage(id) { currentStage.value = id }
function authorizeCases() { dataAuthorized.value = true; currentStage.value = 2 }
function toggleDoc(item) { item.selected = !item.selected }
function buildRecommendation() {
  const sources = selectedDocs.value
  const sourceTitles = sources.map((item) => item.title).join('、') || '当前未选择文档'
  selectedTopic.value = {
    ...selectedTopic.value,
    title: `基于 ${sources.length} 篇教案的乡村课堂研究课题`,
    meta: `推荐依据：系统分析 ${sourceTitles} 后，识别出高频研究主题。`,
    extra: '申报模板：区级课题 A-03；专家资源：刘教授、陈老师。',
    transformed: false,
    createdAt: '',
    sources: sources.map((item) => item.title),
  }
  currentStage.value = 3
}
function saveTopic() {
  const now = new Date()
  const payload = {
    ...selectedTopic.value,
    id: Date.now(),
    createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    sources: selectedDocs.value.map((item) => item.title),
  }
  topicLibrary.value.unshift(payload)
  activeTopicId.value = payload.id
  selectedTopic.value = { ...payload }
  currentStage.value = 4
}
function openTopic(item) { activeTopicId.value = item.id; selectedTopic.value = { ...item }; currentStage.value = 4 }
function transformResult() {
  selectedTopic.value = { ...selectedTopic.value, transformed: true, extra: `${selectedTopic.value.extra} 已生成成果转化任务。` }
  if (activeTopic.value) {
    const index = topicLibrary.value.findIndex((item) => item.id === activeTopic.value.id)
    if (index >= 0) topicLibrary.value[index] = { ...selectedTopic.value, id: activeTopic.value.id }
  }
}
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.research.title" subtitle="" :stats="midApp.research.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
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
        <div class="workspace-panel-head"><strong>我的课题库</strong><span class="header-channel">{{ topicLibrary.length }} 项</span></div>
        <div class="card-list">
          <article v-for="item in topicLibrary.slice(0, 4)" :key="item.id" class="history-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
            <strong>{{ item.title }}</strong><small>{{ item.createdAt }}</small>
          </article>
        </div>
      </UiCard>
    </template>

    <section class="feature-screen mid-ops-board mid-research-archive-board">
      <section v-if="currentStage === 1" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>先授权教学案例数据</h3></div><span class="status-pill"><Telescope :size="14" /> {{ recommendationState }}</span></div>
        <div class="bottom-action-bar"><UiButton @click="authorizeCases"><LockKeyhole :size="16" /> 授权案例数据</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>选择教案来源</h3></div><label class="old-library-search"><Search :size="15" /><input v-model="keyword" placeholder="搜索教案标题 / 学校 / 年级" /></label></div>
        <div class="old-library-tags">
          <button v-for="item in categoryList" :key="item" type="button" class="old-library-tag" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
        </div>
        <div class="old-library-grid">
          <article v-for="item in filteredDocs" :key="item.id" class="old-doc-card" :class="{ active: item.selected }" @click="toggleDoc(item)">
            <div class="old-doc-cover">教案</div>
            <div class="old-doc-body"><strong>{{ item.title }}</strong><p>{{ item.summary }}</p><small>{{ item.subject }} ｜ {{ item.grade }} ｜ {{ item.school }}</small></div>
          </article>
        </div>
        <div class="bottom-action-bar"><UiButton @click="buildRecommendation"><Files :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card research-topic-editor-box">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>创建课题</h3></div></div>
        <div class="selected-source-list">
          <article v-for="item in selectedDocs" :key="item.id" class="selected-source-row"><strong>{{ item.title }}</strong><small>{{ item.subject }} · {{ item.grade }}</small></article>
        </div>
        <input v-model="selectedTopic.title" placeholder="请输入研究选题" />
        <textarea v-model="selectedTopic.meta" rows="4"></textarea>
        <textarea v-model="selectedTopic.extra" rows="5"></textarea>
        <div class="preview-paper old-library-preview"><pre>{{ topicSummary }}</pre></div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="expertOpen = true"><Send :size="16" /> 咨询专家</UiButton>
          <UiButton variant="secondary" @click="transformResult"><BookPlus :size="16" /> 成果转化</UiButton>
          <UiButton @click="saveTopic"><FileBadge2 :size="16" /> 创建课题</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 4" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 4</p><h3>我的课题库</h3></div></div>
        <div class="my-topic-list">
          <article v-for="item in topicLibrary" :key="item.id" class="my-topic-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
            <strong>{{ item.title }}</strong><small>{{ item.createdAt }}</small>
          </article>
        </div>
      </section>

      <UiDialog v-model:open="expertOpen" title="专家咨询草稿" description="">
        <div class="preview-paper old-library-preview"><pre>{{ topicSummary }}</pre></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
