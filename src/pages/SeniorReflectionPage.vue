<script setup>
import { computed, ref, watch } from 'vue'
import { BookOpenText, CheckCheck, Link2, Mic, MicOff, Save, Target } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiTabs from '../components/ui/UiTabs.vue'
import { seniorApp } from '../mock/platformData'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: lessonDrafts, addAnnotation } = useSeniorLessonStore()

const draft = ref('')
const activeTab = ref('all')
const selectedLessonId = ref(null)
const selectedSection = ref('goal')
const records = ref(seniorApp.reflection.records.map((item) => ({ ...item, lessonId: null, section: 'goal' })))
const recognition = useSpeechRecognition()

watch(
  () => recognition.liveText.value,
  (value) => {
    if (recognition.isListening.value && value) draft.value = value
  },
)

const tabs = [
  { label: '全部记录', value: 'all' },
  { label: '教学目标', value: 'goal' },
  { label: '本地案例', value: 'localCase' },
  { label: '活动设计', value: 'activity' },
]

const sectionOptions = [
  { value: 'goal', label: '教学目标' },
  { value: 'localCase', label: '本地案例' },
  { value: 'activity', label: '活动设计' },
]

const selectedLesson = computed(() => lessonDrafts.value.find((item) => item.id === selectedLessonId.value) ?? null)

const visibleRecords = computed(() => {
  if (!selectedLessonId.value) return []
  const byLesson = records.value.filter((item) => item.lessonId === selectedLessonId.value)
  if (activeTab.value === 'all') return byLesson
  return byLesson.filter((item) => item.section === activeTab.value)
})

const reflectionSteps = computed(() => [
  {
    id: 1,
    title: '先选择教案',
    hint: selectedLesson.value ? `当前：${selectedLesson.value.title}` : '先在顶部教案区点击一份教案。',
    status: selectedLesson.value ? 'done' : 'current',
  },
  {
    id: 2,
    title: '语音描述课堂问题',
    hint: draft.value.trim() ? '问题已转写为文字，可直接关联。' : '选教案后再点击麦克风输入问题。',
    status: draft.value.trim() ? 'done' : selectedLesson.value ? 'current' : 'waiting',
  },
  {
    id: 3,
    title: '关联并沉淀记录',
    hint: '保存后会标注到教案对应位置，并进入个人教学记录。',
    status: visibleRecords.value.length ? 'done' : 'waiting',
  },
])

function getCover(seed) {
  return `https://picsum.photos/seed/senior-lesson-${seed}/680/380`
}

function sectionCount(lesson, section) {
  return lesson?.annotations?.[section]?.length || 0
}

function toggleVoiceInput() {
  if (recognition.isListening.value) {
    recognition.stop()
    return
  }
  recognition.reset(draft.value)
  recognition.start()
}

function saveReflectionRecord() {
  if (!draft.value.trim() || !selectedLessonId.value) return
  const section = selectedSection.value
  const sectionLabel = sectionOptions.find((item) => item.value === section)?.label || '教学目标'
  const now = new Date()
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const note = {
    id: Date.now(),
    title: `课堂问题 · ${sectionLabel}`,
    time: `今天 ${timeLabel}`,
    text: draft.value,
    lessonId: selectedLessonId.value,
    section,
  }

  records.value.unshift(note)

  addAnnotation(selectedLessonId.value, section, {
    id: note.id,
    time: note.time,
    text: note.text,
  })

  draft.value = ''
}

function useRecord(item) {
  draft.value = item.text
  selectedSection.value = item.section || 'goal'
}
</script>

<template>
  <SoloAppShell :app-name="seniorApp.appName" :title="seniorApp.reflection.title" :subtitle="seniorApp.reflection.subtitle" :stats="seniorApp.reflection.stats" :nav-items="seniorApp.navItems" :theme="seniorApp.theme">
    <section class="feature-screen senior-workbench senior-page-distinct senior-reflection-journey with-usage-float">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">反思主线</p>
          <h3>先选教案，再语音描述问题，最后关联沉淀记录</h3>
        </div>
        <span class="status-pill"><Link2 :size="14" /> 教案驱动反思</span>
      </div>

      <div class="visual-card lesson-select-zone">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 1</p>
            <h3>先确认要关联哪一份教案</h3>
          </div>
          <span class="status-pill"><BookOpenText :size="14" /> 共 {{ lessonDrafts.length }} 份教案</span>
        </div>

        <div class="lesson-notebook-grid">
          <article
            v-for="item in lessonDrafts"
            :key="item.id"
            class="lesson-notebook-card clickable-card"
            :class="{ active: selectedLessonId === item.id }"
            @click="selectedLessonId = item.id"
          >
            <img :src="getCover(item.id)" :alt="item.title" class="lesson-notebook-cover" />
            <div class="lesson-notebook-body">
              <strong>{{ item.title }}</strong>
              <p>{{ item.summary }}</p>
              <small>{{ item.updatedAt }}</small>
              <div class="lesson-marker-row">
                <span class="timeline-role">目标 {{ sectionCount(item, 'goal') }}</span>
                <span class="timeline-role">案例 {{ sectionCount(item, 'localCase') }}</span>
                <span class="timeline-role">活动 {{ sectionCount(item, 'activity') }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-if="selectedLesson" class="journey-layout reflection-journey-layout no-left-sidebar">
        <aside class="journey-sidebar reflection-sidebar">
          <div class="visual-card journey-guide-card reflection-guide-card usage-float-panel">
            <p class="hero-kicker">使用顺序</p>
            <h3>按三步完成一次课堂反思</h3>
            <div class="journey-step-list">
              <article v-for="step in reflectionSteps" :key="step.id" class="journey-step-card" :class="`is-${step.status}`">
                <span class="journey-step-index">{{ step.id }}</span>
                <div>
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.hint }}</p>
                </div>
              </article>
            </div>
          </div>

          <div class="visual-card reflection-radar-card">
            <div class="panel-headline">
              <div>
                <p class="hero-kicker">当前关联教案</p>
                <h3>{{ selectedLesson.title }}</h3>
              </div>
              <span class="status-pill"><Target :size="14" /> 可继续记录</span>
            </div>
            <p>{{ selectedLesson.summary }}</p>
          </div>
        </aside>

        <div class="journey-main reflection-journey-main">
          <section class="editor-card flow-stage-card reflection-editor-card">
            <div class="flow-stage-head">
              <div>
                <p class="hero-kicker">STEP 2</p>
                <h3>语音描述课堂问题并选择标注位置</h3>
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
              <p>{{ recognition.isListening.value ? '正在聆听课堂问题描述…' : '点击麦克风后可直接说出课堂问题' }}</p>
            </div>

            <div class="reflection-link-row">
              <label class="screen-label">标注到教案位置</label>
              <div class="choice-bar reflection-link-choice">
                <button
                  v-for="item in sectionOptions"
                  :key="item.value"
                  class="choice-btn"
                  :class="{ active: selectedSection === item.value }"
                  @click="selectedSection = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <textarea v-model="draft" rows="8" placeholder="例如：活动说明偏晚，导致展示时间不足。"></textarea>
            <p v-if="recognition.error.value" class="helper-error">{{ recognition.error.value }}</p>
            <p v-else class="helper-copy">语音会自动转写成文字，保存后会标注到所选教案位置。</p>

            <div class="bottom-action-bar">
              <UiButton @click="saveReflectionRecord" :disabled="!draft.trim()">
                <Save :size="16" /> 关联并保存记录
              </UiButton>
            </div>
          </section>

          <section class="card-list reflection-timeline-zone">
            <div class="panel-headline">
              <div>
                <p class="hero-kicker">STEP 3 · 个人教学记录</p>
                <h3>可随时查看该教案下已沉淀的课堂问题</h3>
              </div>
            </div>

            <UiTabs v-model="activeTab" :items="tabs" />

            <div class="answer-timeline reflection-stack-list">
              <article v-for="item in visibleRecords" :key="item.id" class="data-card clickable-card reflection-item" @click="useRecord(item)">
                <div class="timeline-dot"><CheckCheck :size="16" /></div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.text }}</p>
                <small>{{ item.time }}</small>
              </article>
              <article v-if="!visibleRecords.length" class="data-card">
                <strong>暂无记录</strong>
                <p>已选择教案，继续通过语音输入课堂问题并保存关联。</p>
              </article>
            </div>
          </section>
        </div>
      </div>

      <section v-else class="visual-card waiting-select-card">
        <strong>请先选择一份教案</strong>
        <p>选中上方任一教案后，系统才会显示语音输入与记录关联功能。</p>
      </section>
    </section>
  </SoloAppShell>
</template>
