<script setup>
import { computed, ref, watch } from 'vue'
import { FileText, Mic, MicOff, Save, Sparkles, SquarePen, Target } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { seniorApp } from '../mock/platformData'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: savedDrafts, buildDraftContent, addDraft, updateDraft } = useSeniorLessonStore()

const voiceInput = ref(seniorApp.lesson.input)
const generatedDraft = ref('')
const generateProgress = ref(0)
const currentStep = ref('等待语音输入')
const isGenerating = ref(false)

const selectedSavedId = ref(savedDrafts.value[0]?.id ?? null)
const editableTitle = ref(savedDrafts.value[0]?.title ?? '')
const editableContent = ref(savedDrafts.value[0]?.content ?? '')

const recognition = useSpeechRecognition()

watch(
  () => recognition.liveText.value,
  (value) => {
    if (recognition.isListening.value && value) voiceInput.value = value
  },
)

watch(
  () => savedDrafts.value,
  (value) => {
    if (!value.length) return
    if (!selectedSavedId.value) {
      selectSavedDraft(value[0])
    }
  },
  { deep: true },
)

const flowSteps = computed(() => [
  {
    id: 1,
    title: '语音输入需求',
    hint: '先说清学段、教学目标和本地情境。',
    status: voiceInput.value.trim() ? 'done' : 'current',
  },
  {
    id: 2,
    title: '生成结构化草稿',
    hint: generatedDraft.value ? '已生成，请保存到第三部分。' : '生成后只能预览，不能在这里编辑。',
    status: generatedDraft.value ? 'done' : 'current',
  },
  {
    id: 3,
    title: '在版本区回看与编辑',
    hint: '点击版本后在下方编辑并保存修改。',
    status: selectedSavedId.value ? 'current' : 'waiting',
  },
])

const selectedSavedDraft = computed(() => savedDrafts.value.find((item) => item.id === selectedSavedId.value) ?? null)

const annotationGroups = computed(() => {
  const annotations = selectedSavedDraft.value?.annotations || { goal: [], localCase: [], activity: [] }
  return [
    { key: 'goal', title: '教学目标', list: annotations.goal || [] },
    { key: 'localCase', title: '本地案例', list: annotations.localCase || [] },
    { key: 'activity', title: '活动设计', list: annotations.activity || [] },
  ]
})

function toggleVoiceInput() {
  if (recognition.isListening.value) {
    recognition.stop()
    return
  }
  recognition.reset(voiceInput.value)
  recognition.start()
}

function generateDraft() {
  isGenerating.value = true
  generateProgress.value = 18
  currentStep.value = '正在解析语音需求'

  window.setTimeout(() => {
    generateProgress.value = 52
    currentStep.value = '正在匹配教学目标/本地案例'
  }, 320)

  window.setTimeout(() => {
    generateProgress.value = 82
    currentStep.value = '正在组织活动设计'
  }, 720)

  window.setTimeout(() => {
    generatedDraft.value = buildDraftContent(voiceInput.value)
    generateProgress.value = 100
    currentStep.value = '生成完成：请保存到第三部分后再编辑'
    isGenerating.value = false
  }, 1120)
}

function saveGeneratedToStageThree() {
  if (!generatedDraft.value.trim()) return
  const item = {
    id: Date.now(),
    title: '新建教案草稿',
    summary: '已保存 · 含目标/案例/活动设计',
    updatedAt: '刚刚',
    content: generatedDraft.value,
    annotations: { goal: [], localCase: [], activity: [] },
  }
  addDraft(item)
  selectSavedDraft(item)
  currentStep.value = '已保存到第三部分，可回看和编辑'
}

function selectSavedDraft(item) {
  selectedSavedId.value = item.id
  editableTitle.value = item.title
  editableContent.value = item.content
}

function saveEditedDraft() {
  if (!selectedSavedDraft.value) return
  updateDraft(selectedSavedId.value, {
    title: editableTitle.value || '未命名草稿',
    content: editableContent.value,
    summary: '已编辑 · 含目标/案例/活动设计',
    updatedAt: '刚刚',
  })
}
</script>

<template>
  <SoloAppShell :app-name="seniorApp.appName" :title="seniorApp.lesson.title" :subtitle="seniorApp.lesson.subtitle" :stats="seniorApp.lesson.stats" :nav-items="seniorApp.navItems" :theme="seniorApp.theme">
    <section class="feature-screen senior-workbench senior-page-distinct senior-lesson-optimized with-usage-float">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">备课主线</p>
          <h3>语音输入需求 → 生成结构化草稿 → 在版本区回看与编辑</h3>
        </div>
        <span class="status-pill"><Mic :size="14" /> 快速结构化教案</span>
      </div>

      <div class="visual-card journey-guide-card lesson-guide-card usage-float-panel">
        <p class="hero-kicker">使用顺序</p>
        <div class="journey-step-list lesson-step-inline">
          <article v-for="step in flowSteps" :key="step.id" class="journey-step-card" :class="`is-${step.status}`">
            <span class="journey-step-index">{{ step.id }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.hint }}</p>
            </div>
          </article>
        </div>
      </div>

      <section class="editor-card flow-stage-card lesson-stage-card">
        <div class="flow-stage-head">
          <div>
            <p class="hero-kicker">STEP 1</p>
            <h3>老师通过语音输入需求</h3>
          </div>
          <UiButton class="mic-btn" :class="{ listening: recognition.isListening.value }" @click="toggleVoiceInput">
            <Mic v-if="!recognition.isListening.value" :size="16" />
            <MicOff v-else :size="16" />
            {{ recognition.isListening.value ? '停止输入' : '麦克风输入' }}
          </UiButton>
        </div>

        <div class="lesson-mic-status" :class="{ listening: recognition.isListening.value }">
          <div class="mic-live-indicator" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <p>{{ recognition.isListening.value ? '正在聆听语音输入…' : '点击麦克风后可直接说话输入需求' }}</p>
        </div>

        <textarea v-model="voiceInput" rows="5"></textarea>
        <p class="helper-copy">建议一句话说清：教学目标 + 本地案例 + 活动设计重点。</p>
        <p v-if="recognition.error.value" class="helper-error">{{ recognition.error.value }}</p>
      </section>

      <section class="editor-card flow-stage-card lesson-output-card">
        <div class="flow-stage-head">
          <div>
            <p class="hero-kicker">STEP 2</p>
            <h3>快速生成结构化教案草稿（此区仅预览）</h3>
          </div>
          <span class="status-pill"><FileText :size="14" /> 预览区</span>
        </div>

        <UiProgress :value="generateProgress" :label="currentStep" />
        <textarea :value="generatedDraft" rows="12" readonly placeholder="生成后会在此显示草稿预览" />

        <div class="bottom-action-bar">
          <UiButton @click="generateDraft" :disabled="isGenerating">
            <Sparkles :size="16" /> {{ isGenerating ? '生成中…' : '生成结构化草稿' }}
          </UiButton>
          <UiButton variant="secondary" @click="saveGeneratedToStageThree" :disabled="!generatedDraft.trim()">
            <Save :size="16" /> 保存到第三部分
          </UiButton>
        </div>
      </section>

      <section class="card-list senior-draft-list lesson-history-zone">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 3</p>
            <h3>点击版本回看并编辑（编辑入口只在这里）</h3>
          </div>
        </div>

        <div class="senior-history-grid">
          <article
            v-for="item in savedDrafts"
            :key="item.id"
            class="data-card clickable-card lesson-history-card"
            :class="{ active: selectedSavedId === item.id }"
            @click="selectSavedDraft(item)"
          >
            <div class="lesson-history-meta">
              <strong>{{ item.title }}</strong>
              <span class="status-pill"><FileText :size="14" /> 版本</span>
            </div>
            <p>{{ item.summary }}</p>
            <small>{{ item.updatedAt }}</small>
          </article>
        </div>

        <div v-if="selectedSavedDraft" class="editor-card version-edit-card">
          <div class="flow-stage-head">
            <div>
              <p class="hero-kicker">版本编辑</p>
              <h3>当前版本：{{ selectedSavedDraft.title }}</h3>
            </div>
            <span class="status-pill"><SquarePen :size="14" /> 可编辑</span>
          </div>
          <input v-model="editableTitle" placeholder="草稿标题" />
          <textarea v-model="editableContent" rows="12"></textarea>
          <div class="bottom-action-bar">
            <UiButton @click="saveEditedDraft">
              <Save :size="16" /> 保存修改
            </UiButton>
          </div>

          <div class="annotation-board">
            <div class="panel-headline">
              <div>
                <p class="hero-kicker">课堂问题标注</p>
                <h3>本版本已关联的语音问题记录</h3>
              </div>
              <span class="status-pill"><Target :size="14" /> 对应教案位置</span>
            </div>
            <div class="annotation-grid">
              <article v-for="group in annotationGroups" :key="group.key" class="annotation-card">
                <strong>{{ group.title }}</strong>
                <div v-if="group.list.length" class="annotation-list">
                  <p v-for="note in group.list" :key="note.id">{{ note.time }}｜{{ note.text }}</p>
                </div>
                <p v-else class="annotation-empty">暂无关联问题</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </section>
  </SoloAppShell>
</template>
