<script setup>
import { computed, ref, watch } from 'vue'
import { BookCopy, BookOpenText, CheckCheck, CheckCircle2, Link2, ListTodo, Mic, MicOff, Save } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { seniorApp } from '../mock/platformData'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: lessonDrafts, addAnnotation } = useSeniorLessonStore()
const draft = ref('')
const selectedLessonId = ref(null)
const currentStage = ref(1)
const records = ref(seniorApp.reflection.records.map((item) => ({ ...item, lessonId: null, annotations: [] })))
const recognition = useSpeechRecognition()

watch(() => recognition.liveText.value, (value) => {
  if (recognition.isListening.value && value) draft.value = value
})

const selectedLesson = computed(() => lessonDrafts.value.find((item) => item.id === selectedLessonId.value) ?? null)
const visibleRecords = computed(() => selectedLessonId.value ? records.value.filter((item) => item.lessonId === selectedLessonId.value) : [])
const reflectionSteps = computed(() => [
  { id: 1, title: '先选择教案', hint: selectedLesson.value ? `当前：${selectedLesson.value.title}` : '先点击一份教案。' },
  { id: 2, title: '语音描述问题', hint: draft.value.trim() ? '问题已转写，可直接保存。' : '点击麦克风输入课堂问题。' },
  { id: 3, title: '查看教学记录', hint: '系统会自动把问题批注到教案对应位置。' },
])
const todoList = computed(() => [
  { id: 't1', text: '选择当前关联教案', done: !!selectedLesson.value },
  { id: 't2', text: '语音输入课堂问题', done: !!draft.value.trim() },
  { id: 't3', text: '保存并生成批注记录', done: !!visibleRecords.value.length },
])
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const lessonPreview = computed(() => {
  if (!selectedLesson.value) return ''
  const annotations = selectedLesson.value.annotations || { goal: [], localCase: [], activity: [] }
  let content = selectedLesson.value.content || ''
  content = content.replace('## 二、教学目标', `## 二、教学目标\n${formatAnnotationBlock(annotations.goal || [], '教学目标批注')}`)
  content = content.replace('## 三、本地案例资源', `## 三、本地案例资源\n${formatAnnotationBlock(annotations.localCase || [], '本地案例批注')}`)
  content = content.replace('## 四、活动设计（40 分钟）', `## 四、活动设计（40 分钟）\n${formatAnnotationBlock(annotations.activity || [], '活动设计批注')}`)
  return renderMarkdown(content)
})

function getCover(seed) {
  return `https://picsum.photos/seed/senior-lesson-${seed}/680/380`
}
function sectionCount(lesson, section) {
  return lesson?.annotations?.[section]?.length || 0
}
function goStage(id) {
  currentStage.value = id
}
function nextStage() {
  if (currentStage.value < 3) currentStage.value += 1
}
function selectLesson(item) {
  selectedLessonId.value = item.id
  if (currentStage.value === 1) currentStage.value = 2
}
function toggleVoiceInput() {
  if (recognition.isListening.value) return recognition.stop()
  recognition.reset(draft.value)
  recognition.start()
}
function randomSection() {
  const sections = ['goal', 'localCase', 'activity']
  return sections[Math.floor(Math.random() * sections.length)]
}
function buildRandomAnnotations(text, time) {
  const templates = [
    (value) => `课堂问题：${value}`,
    (value) => `跟进建议：建议下次围绕“${value.slice(0, 12)}”提前给出操作提示。`,
    (value) => `复盘提醒：本节课中与“${value.slice(0, 10)}”相关的环节需要延长 2-3 分钟。`,
  ]
  return templates.map((factory, index) => ({ id: `${Date.now()}-${index}`, section: randomSection(), time, text: factory(text) }))
}
function saveReflectionRecord() {
  if (!draft.value.trim() || !selectedLessonId.value) return
  const now = new Date()
  const timeLabel = `今天 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const annotations = buildRandomAnnotations(draft.value, timeLabel)
  annotations.forEach((item) => addAnnotation(selectedLessonId.value, item.section, { id: item.id, time: item.time, text: item.text }))
  records.value.unshift({ id: Date.now(), title: '课堂问题已自动关联到教案', time: timeLabel, text: draft.value, lessonId: selectedLessonId.value, annotations })
  draft.value = ''
  currentStage.value = 3
}
function useRecord(item) {
  draft.value = item.text
  currentStage.value = 2
}
function formatAnnotationBlock(list, title) {
  if (!list.length) return ''
  const body = list.slice(0, 3)
    .map((item) => `<p><strong>${item.time}</strong> ${item.text}</p>`)
    .join('')
  return `\n<div class="md-annotation-block"><span class="md-annotation-label">${title}</span>${body}</div>\n`
}
function renderMarkdown(markdown = '') {
  const annotationTokens = []
  const protectedMarkdown = markdown.replace(/<div class="md-annotation-block">[\s\S]*?<\/div>/g, (block) => {
    const token = `__ANNOTATION_${annotationTokens.length}__`
    annotationTokens.push(block)
    return token
  })

  const escaped = protectedMarkdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const headingHandled = escaped.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>').replace(/^##\s+(.*)$/gm, '<h2>$1</h2>').replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
  const listHandled = headingHandled.replace(/^(\-\s+.*(?:\n\-\s+.*)*)/gm, (block) => `<ul>${block.split('\n').map((line) => `<li>${line.replace(/^\-\s+/, '').trim()}</li>`).join('')}</ul>`)
  const paragraphHandled = listHandled.split(/\n\n+/).map((chunk) => {
    const trimmed = chunk.trim()
    if (!trimmed) return ''
    if (/^<h\d|^<ul>/.test(trimmed) || /^__ANNOTATION_\d+__$/.test(trimmed)) return trimmed
    return `<p>${chunk.replace(/\n/g, '<br>')}</p>`
  }).join('')

  return paragraphHandled.replace(/__ANNOTATION_(\d+)__/g, (_, index) => annotationTokens[Number(index)] || '')
}
</script>

<template>
  <SoloAppShell :app-name="seniorApp.appName" :title="seniorApp.reflection.title" :subtitle="seniorApp.reflection.subtitle" :stats="seniorApp.reflection.stats" :nav-items="seniorApp.navItems" :theme="seniorApp.theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head"><ListTodo :size="16" /><strong>使用顺序</strong></div>
          <div class="bookmark-progress"><UiProgress :value="navProgress" label="当前步骤" /></div>
          <button v-for="step in reflectionSteps" :key="step.id" type="button" class="bookmark-item" :class="{ active: currentStage === step.id }" @click="goStage(step.id)">
            <span class="bookmark-index">{{ step.id }}</span>
            <div><strong>{{ step.title }}</strong><p>{{ step.hint }}</p></div>
          </button>
        </div>
        <div class="bookmark-card">
          <div class="bookmark-head"><CheckCircle2 :size="16" /><strong>工作清单</strong></div>
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }"><span class="todo-dot"></span><p>{{ todo.text }}</p></article>
        </div>
        <div class="bookmark-card">
          <div class="bookmark-head"><BookCopy :size="16" /><strong>教案列表</strong></div>
          <article v-for="item in lessonDrafts" :key="item.id" class="history-row" :class="{ active: selectedLessonId === item.id }" @click="selectLesson(item)">
            <strong>{{ item.title }}</strong><small>{{ item.updatedAt }}</small>
          </article>
        </div>
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>关联信息</strong><span class="header-channel">反思工作台</span></div>
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>当前教案：{{ selectedLesson?.title || '未选择' }}</span></li>
          <li><span class="workspace-check"></span><span>目标批注：{{ sectionCount(selectedLesson, 'goal') }}</span></li>
          <li><span class="workspace-check"></span><span>案例批注：{{ sectionCount(selectedLesson, 'localCase') }}</span></li>
          <li><span class="workspace-check"></span><span>活动批注：{{ sectionCount(selectedLesson, 'activity') }}</span></li>
        </ul>
        <div class="workspace-panel-foot"><strong>自动关联</strong><p>系统会随机把反思批注插入原教案对应位置。</p></div>
      </UiCard>
    </template>

    <section class="feature-screen senior-workbench lesson-main-stage">
      <main class="lesson-center-stage">
        <section v-if="currentStage === 1" class="editor-card flow-stage-card">
          <div class="flow-stage-head"><div><p class="hero-kicker">STEP 1</p><h3>先选择要关联的教案</h3></div><span class="status-pill"><BookOpenText :size="14" /> 共 {{ lessonDrafts.length }} 份教案</span></div>
          <div class="lesson-notebook-grid">
            <article v-for="item in lessonDrafts" :key="item.id" class="lesson-notebook-card clickable-card" :class="{ active: selectedLessonId === item.id }" @click="selectLesson(item)">
              <img :src="getCover(item.id)" :alt="item.title" class="lesson-notebook-cover" />
              <div class="lesson-notebook-body"><strong>{{ item.title }}</strong><p>{{ item.summary }}</p><small>{{ item.updatedAt }}</small><div class="lesson-marker-row"><span class="timeline-role">目标 {{ sectionCount(item, 'goal') }}</span><span class="timeline-role">案例 {{ sectionCount(item, 'localCase') }}</span><span class="timeline-role">活动 {{ sectionCount(item, 'activity') }}</span></div></div>
            </article>
          </div>
          <div class="bottom-action-bar"><UiButton @click="nextStage" :disabled="!selectedLessonId"><Link2 :size="16" /> 下一步：录入问题</UiButton></div>
        </section>

        <section v-if="currentStage === 2" class="editor-card flow-stage-card">
          <div class="flow-stage-head"><div><p class="hero-kicker">STEP 2</p><h3>语音描述课堂问题，系统自动转写并关联到教案</h3></div><UiButton class="mic-btn" :class="{ listening: recognition.isListening.value }" @click="toggleVoiceInput" :disabled="!selectedLessonId"><Mic v-if="!recognition.isListening.value" :size="16" /><MicOff v-else :size="16" />{{ recognition.isListening.value ? '停止输入' : '麦克风输入' }}</UiButton></div>
          <div class="lesson-mic-status" :class="{ listening: recognition.isListening.value }"><div class="mic-live-indicator" aria-hidden="true"><span></span><span></span><span></span></div><p>{{ recognition.isListening.value ? '正在聆听课堂问题描述…' : '点击麦克风后可直接说出课堂问题' }}</p></div>
          <textarea v-model="draft" rows="8" placeholder="例如：活动说明偏晚，导致展示时间不足。"></textarea>
          <p v-if="recognition.error.value" class="helper-error">{{ recognition.error.value }}</p>
          <p v-else class="helper-copy">语音会自动转写成文字，保存后系统会随机生成批注并插入原教案。</p>
          <div class="bottom-action-bar"><UiButton @click="saveReflectionRecord" :disabled="!draft.trim() || !selectedLessonId"><Save :size="16" /> 关联并保存记录</UiButton></div>
        </section>

        <section v-if="currentStage === 3" class="card-list reflection-timeline-zone">
          <div class="panel-headline"><div><p class="hero-kicker">STEP 3 · 个人教学记录</p><h3>查看当前教案下的反思记录与插入后的教案</h3></div></div>
          <div class="answer-timeline reflection-stack-list">
            <article v-for="item in visibleRecords" :key="item.id" class="data-card clickable-card reflection-item" @click="useRecord(item)">
              <div class="timeline-dot"><CheckCheck :size="16" /></div>
              <strong>{{ item.title }}</strong><p>{{ item.text }}</p><small>{{ item.time }}</small>
              <ul class="workspace-checklist"><li v-for="annotation in item.annotations" :key="annotation.id"><span class="workspace-check"></span><span>{{ annotation.time }} · {{ annotation.text }}</span></li></ul>
            </article>
            <article v-if="!visibleRecords.length" class="data-card"><strong>暂无记录</strong><p>请先在步骤 2 保存至少一条反思记录。</p></article>
          </div>
          <div v-if="selectedLesson" class="editor-card"><div class="panel-headline"><div><p class="hero-kicker">原教案（已插入批注）</p><h3>{{ selectedLesson.title }}</h3></div></div><div class="markdown-preview" v-html="lessonPreview"></div></div>
        </section>
      </main>
    </section>
  </SoloAppShell>
</template>
