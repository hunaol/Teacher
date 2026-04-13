<script setup>
import { computed, ref, watch } from 'vue'
import { BookCopy, CheckCircle2, FilePenLine, ListTodo, Mic, MicOff, Save, Sparkles, StepForward } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { seniorApp } from '../mock/platformData'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: savedDrafts, buildDraftContent, addDraft, updateDraft } = useSeniorLessonStore()

const voiceInput = ref(seniorApp.lesson.input)
const generatedDraft = ref('')
const generateProgress = ref(0)
const generateStatus = ref('等待生成')
const isGenerating = ref(false)

const currentStage = ref(1)
const selectedSavedId = ref(savedDrafts.value[0]?.id ?? null)
const editableTitle = ref(savedDrafts.value[0]?.title ?? '')
const editableContent = ref(savedDrafts.value[0]?.content ?? '')
const markdownView = ref('edit')

const recognition = useSpeechRecognition()

watch(
  () => recognition.liveText.value,
  (value) => {
    if (recognition.isListening.value && value) voiceInput.value = value
  },
)

const selectedSavedDraft = computed(() => savedDrafts.value.find((item) => item.id === selectedSavedId.value) ?? null)

const workflow = computed(() => [
  {
    id: 1,
    title: '语音输入需求',
    hint: '先说学段、目标、本地案例与活动结构。',
    done: !!voiceInput.value.trim(),
  },
  {
    id: 2,
    title: '生成结构化草稿',
    hint: '系统生成 Markdown 教案草稿。',
    done: !!generatedDraft.value.trim(),
  },
  {
    id: 3,
    title: '编辑并保存',
    hint: '在历史教案中查看、编辑并保存版本。',
    done: !!selectedSavedDraft.value,
  },
])

const todoList = computed(() => [
  { id: 't1', text: '录入本节课需求', done: !!voiceInput.value.trim() },
  { id: 't2', text: '生成 Markdown 教案', done: !!generatedDraft.value.trim() },
  { id: 't3', text: '保存到历史教案', done: !!selectedSavedDraft.value && !!generatedDraft.value.trim() },
  { id: 't4', text: '完成一次版本编辑', done: editableContent.value !== (selectedSavedDraft.value?.content || '') },
])

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

function toggleVoiceInput() {
  if (recognition.isListening.value) {
    recognition.stop()
    return
  }
  recognition.reset(voiceInput.value)
  recognition.start()
}

function goStage(id) {
  currentStage.value = id
}

function nextStage() {
  if (currentStage.value < 3) currentStage.value += 1
}

function generateDraft() {
  isGenerating.value = true
  generateProgress.value = 16
  generateStatus.value = '正在解析语音需求'

  window.setTimeout(() => {
    generateProgress.value = 44
    generateStatus.value = '正在生成教学目标与评价标准'
  }, 320)

  window.setTimeout(() => {
    generateProgress.value = 72
    generateStatus.value = '正在匹配本地案例与活动流程'
  }, 720)

  window.setTimeout(() => {
    generatedDraft.value = buildDraftContent(voiceInput.value)
    generateProgress.value = 100
    generateStatus.value = '生成完成，可保存到历史教案并进入编辑'
    isGenerating.value = false
  }, 1160)
}

function saveGeneratedToHistory() {
  if (!generatedDraft.value.trim()) return
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const item = {
    id: Date.now(),
    title: `教案草稿-${time}`,
    summary: '结构化教案 · Markdown 版本',
    updatedAt: `今天 ${time}`,
    content: generatedDraft.value,
    annotations: { goal: [], localCase: [], activity: [] },
  }
  addDraft(item)
  selectSavedDraft(item)
  currentStage.value = 3
}

function selectSavedDraft(item) {
  selectedSavedId.value = item.id
  editableTitle.value = item.title
  editableContent.value = item.content
  currentStage.value = 3
}

function saveEditedDraft() {
  if (!selectedSavedDraft.value) return
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  updateDraft(selectedSavedId.value, {
    title: editableTitle.value || '未命名教案',
    content: editableContent.value,
    summary: '结构化教案 · Markdown 已编辑',
    updatedAt: `今天 ${time}`,
  })
}

function renderMarkdown(markdown = '') {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const codeHandled = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  const headingHandled = codeHandled
    .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

  const listHandled = headingHandled
    .replace(/^(\-\s+.*(?:\n\-\s+.*)*)/gm, (block) => {
      const items = block
        .split('\n')
        .map((line) => line.replace(/^\-\s+/, '').trim())
        .map((line) => `<li>${line}</li>`)
        .join('')
      return `<ul>${items}</ul>`
    })

  const strongHandled = listHandled.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const paragraphHandled = strongHandled
    .split(/\n\n+/)
    .map((chunk) => {
      if (/^<h\d|^<ul>|^<pre>/.test(chunk.trim())) return chunk
      return `<p>${chunk.replace(/\n/g, '<br>')}</p>`
    })
    .join('')

  return paragraphHandled
}

const generatedPreviewHtml = computed(() => renderMarkdown(generatedDraft.value || ''))
const editablePreviewHtml = computed(() => renderMarkdown(editableContent.value || ''))
</script>

<template>
  <SoloAppShell
    :app-name="seniorApp.appName"
    :title="seniorApp.lesson.title"
    :subtitle="seniorApp.lesson.subtitle"
    :stats="seniorApp.lesson.stats"
    :nav-items="seniorApp.navItems"
    :theme="seniorApp.theme"
  >
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head">
            <ListTodo :size="16" />
            <strong>使用顺序</strong>
          </div>
          <div class="bookmark-progress">
            <UiProgress :value="navProgress" label="当前步骤" />
          </div>
          <button
            v-for="item in workflow"
            :key="item.id"
            type="button"
            class="bookmark-item"
            :class="{ active: currentStage === item.id }"
            @click="goStage(item.id)"
          >
            <span class="bookmark-index">{{ item.id }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.hint }}</p>
            </div>
          </button>
        </div>

        <div class="bookmark-card">
          <div class="bookmark-head">
            <CheckCircle2 :size="16" />
            <strong>工作清单</strong>
          </div>
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }">
            <span class="todo-dot"></span>
            <p>{{ todo.text }}</p>
          </article>
        </div>

        <div class="bookmark-card">
          <div class="bookmark-head">
            <BookCopy :size="16" />
            <strong>历史教案</strong>
          </div>
          <article
            v-for="item in savedDrafts"
            :key="item.id"
            class="history-row"
            :class="{ active: selectedSavedId === item.id }"
            @click="selectSavedDraft(item)"
          >
            <strong>{{ item.title }}</strong>
            <small>{{ item.updatedAt }}</small>
          </article>
        </div>
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head">
          <strong>今日工作清单</strong>
          <span class="header-channel">经验沉淀工作台</span>
        </div>
        <ul class="workspace-checklist">
          <li v-for="todo in todoList" :key="todo.id">
            <span class="workspace-check"></span>
            <span>{{ todo.text }}</span>
          </li>
        </ul>
        <div class="workspace-panel-foot">
          <strong>备课</strong>
          <p>建议按页面步骤从上到下完成任务。</p>
        </div>
      </UiCard>
    </template>

    <section class="feature-screen senior-workbench lesson-main-stage">
      <main class="lesson-center-stage">
        <section v-if="currentStage === 1" class="editor-card flow-stage-card">
          <div class="flow-stage-head">
            <div>
              <p class="hero-kicker">STEP 1</p>
              <h3>语音输入本次教案需求</h3>
            </div>
            <UiButton class="mic-btn" :class="{ listening: recognition.isListening.value }" @click="toggleVoiceInput">
              <Mic v-if="!recognition.isListening.value" :size="16" />
              <MicOff v-else :size="16" />
              {{ recognition.isListening.value ? '停止输入' : '麦克风输入' }}
            </UiButton>
          </div>

          <div class="lesson-mic-status" :class="{ listening: recognition.isListening.value }">
            <div class="mic-live-indicator" aria-hidden="true"><span></span><span></span><span></span></div>
            <p>{{ recognition.isListening.value ? '正在转写语音内容…' : '点击麦克风开始录入教学需求' }}</p>
          </div>

          <textarea v-model="voiceInput" rows="8" placeholder="例如：五年级综合实践，围绕秋收农事设计目标、案例和活动流程。"></textarea>
          <p v-if="recognition.error.value" class="helper-error">{{ recognition.error.value }}</p>
          <div class="bottom-action-bar">
            <UiButton @click="nextStage" :disabled="!voiceInput.trim()">
              <StepForward :size="16" /> 下一步：生成草稿
            </UiButton>
          </div>
        </section>

        <section v-if="currentStage === 2" class="editor-card flow-stage-card">
          <div class="flow-stage-head">
            <div>
              <p class="hero-kicker">STEP 2</p>
              <h3>生成并查看 Markdown 教案草稿</h3>
            </div>
            <span class="status-pill"><FilePenLine :size="14" /> Markdown 预览</span>
          </div>

          <UiProgress :value="generateProgress" :label="generateStatus" />

          <div class="markdown-preview" v-html="generatedPreviewHtml"></div>

          <div class="bottom-action-bar">
            <UiButton @click="generateDraft" :disabled="isGenerating">
              <Sparkles :size="16" /> {{ isGenerating ? '生成中…' : '生成教案草稿' }}
            </UiButton>
            <UiButton variant="secondary" @click="saveGeneratedToHistory" :disabled="!generatedDraft.trim()">
              <Save :size="16" /> 保存并进入编辑
            </UiButton>
          </div>
        </section>

        <section v-if="currentStage === 3" class="editor-card flow-stage-card">
          <div class="flow-stage-head">
            <div>
              <p class="hero-kicker">STEP 3</p>
              <h3>Markdown 查看与编辑</h3>
            </div>
            <div class="choice-bar md-toggle">
              <button class="choice-btn" :class="{ active: markdownView === 'edit' }" @click="markdownView = 'edit'">编辑</button>
              <button class="choice-btn" :class="{ active: markdownView === 'preview' }" @click="markdownView = 'preview'">预览</button>
            </div>
          </div>

          <input v-model="editableTitle" placeholder="教案标题" />

          <textarea v-if="markdownView === 'edit'" v-model="editableContent" rows="16"></textarea>
          <div v-else class="markdown-preview" v-html="editablePreviewHtml"></div>

          <div class="bottom-action-bar">
            <UiButton @click="saveEditedDraft">
              <Save :size="16" /> 保存当前版本
            </UiButton>
          </div>
        </section>
      </main>
    </section>
  </SoloAppShell>
</template>
