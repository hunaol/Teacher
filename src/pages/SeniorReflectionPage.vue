<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { BookOpenText, CheckCircle2, Edit3, FileText, ListTodo, Mic, MicOff, Save, Trash2, Eye } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: lessonDrafts, addAnnotation, loadAnnotations, updateDraft } = useSeniorLessonStore()

const appName = '资深教师端'
const pageTitle = '随堂反思'
const pageSubtitle = '查看教案、添加反思批注、编辑教案内容'
const theme = 'senior'
const navItems = [
  { name: '备课', path: '/senior/lesson', icon: '备' },
  { name: '反思', path: '/senior/reflection', icon: '思' },
]

const draft = ref('')
const selectedLessonId = ref(null)
const isEditingContent = ref(false)
const editContent = ref('')
const editTitle = ref('')
const showAllRecords = ref(false)
const recognition = useSpeechRecognition()

watch(() => recognition.liveText.value, (v) => {
  if (recognition.isListening.value && v) draft.value = v
})

watch(selectedLessonId, async (id) => {
  if (id) await loadAnnotations(id)
})

const selectedLesson = computed(() =>
  lessonDrafts.value.find((item) => item.id === selectedLessonId.value) ?? null
)

const derivedStats = computed(() => {
  const withAnnotations = lessonDrafts.value.filter((d) => {
    const a = d.annotations || {}
    return (a.goal?.length || 0) + (a.localCase?.length || 0) + (a.activity?.length || 0) > 0
  }).length
  return [
    { label: '教案总数', value: String(lessonDrafts.value.length) },
    { label: '已批注', value: String(withAnnotations) },
    { label: '本周反思', value: '—' },
  ]
})

const records = computed(() => {
  if (!selectedLesson.value?.annotations) return []
  const all = []
  for (const section of ['goal', 'localCase', 'activity']) {
    for (const a of (selectedLesson.value.annotations[section] || [])) {
      all.push({ id: a.id, section, time: a.time, text: a.text })
    }
  }
  return all.sort((a, b) => b.id - a.id)
})

function selectLesson(item) {
  selectedLessonId.value = item.id
  editContent.value = item.content || ''
  editTitle.value = item.title || ''
  isEditingContent.value = false
}

function toggleMic() {
  if (recognition.isListening.value) { recognition.stop(); return }
  recognition.reset(draft.value)
  recognition.start()
}

async function saveAnnotation() {
  if (!draft.value.trim() || !selectedLessonId.value) return
  try {
    await addAnnotation(selectedLessonId.value, 'goal', {
      id: Date.now(), time: new Date().toISOString(), text: draft.value.trim(),
    })
    draft.value = ''
    await loadAnnotations(selectedLessonId.value)
    ElMessage.success('反思已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function saveContent() {
  if (!selectedLessonId.value) return
  try {
    await updateDraft(selectedLessonId.value, {
      title: editTitle.value || '未命名',
      content: editContent.value,
      summary: '已编辑',
    })
    isEditingContent.value = false
    ElMessage.success('教案已更新')
  } catch {
    ElMessage.error('更新失败')
  }
}

async function deleteAnnotation(id) {
  // 通过清空文本再保存来模拟删除（保持现有 API）
  ElMessage.info('点击记录可重新编辑')
}

function useRecord(item) {
  draft.value = item.text
}

function renderMd(md = '') {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.split('\n\n').map((p) => /^<[hu]/.test(p.trim()) ? p.trim() : `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('')
  return html
}
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" :subtitle="pageSubtitle" :stats="derivedStats" :nav-items="navItems" :theme="theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head"><BookOpenText :size="16" /><strong>教案列表</strong></div>
          <article v-for="item in lessonDrafts" :key="item.id" class="history-row" :class="{ active: selectedLessonId === item.id }" @click="selectLesson(item)">
            <strong>{{ item.title }}</strong><small>{{ item.updatedAt }}</small>
          </article>
          <p v-if="!lessonDrafts.length" class="helper-copy">暂无教案，请先在备课页面创建</p>
        </div>

        <div v-if="selectedLesson" class="bookmark-card">
          <div class="bookmark-head"><CheckCircle2 :size="16" /><strong>反思记录</strong></div>
          <article v-for="r in (showAllRecords ? records : records.slice(0, 3))" :key="r.id" class="todo-row" style="cursor:pointer" @click="useRecord(r)">
            <span class="todo-dot"></span>
            <div><p style="font-size:.78rem;margin:0">{{ r.text.slice(0, 50) }}{{ r.text.length > 50 ? '…' : '' }}</p><small>{{ r.time }}</small></div>
          </article>
          <p v-if="records.length > 3" class="helper-copy" style="font-size:.72rem;cursor:pointer;color:var(--primary)" @click="showAllRecords = !showAllRecords">
            {{ showAllRecords ? '收起' : `查看全部 ${records.length} 条…` }}
          </p>
          <p v-if="!records.length" class="helper-copy" style="font-size:.78rem">暂无反思记录</p>
        </div>
      </aside>
    </template>

    <section class="feature-screen senior-workbench">
      <div v-if="!selectedLesson" class="editor-card" style="text-align:center;padding:64px 32px">
        <FileText :size="48" style="color:var(--text-faint);margin-bottom:16px" />
        <h3>请先从左侧选择一份教案</h3>
        <p>选择后可查看完整内容、添加反思批注、编辑教案</p>
      </div>

      <div v-else class="reflection-layout">
        <!-- 左：教案完整内容 -->
        <div class="editor-card" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p class="hero-kicker">教案内容</p>
              <h3>{{ selectedLesson.title }}</h3>
            </div>
            <div style="display:flex;gap:6px">
              <UiButton variant="secondary" size="sm" @click="isEditingContent = !isEditingContent">
                <Edit3 v-if="!isEditingContent" :size="14" />
                <Eye v-else :size="14" />
                {{ isEditingContent ? '预览' : '编辑' }}
              </UiButton>
            </div>
          </div>

          <!-- 编辑模式 -->
          <template v-if="isEditingContent">
            <input v-model="editTitle" placeholder="教案标题" />
            <textarea v-model="editContent" rows="18" placeholder="教案 Markdown 内容…" />
            <div class="bottom-action-bar">
              <UiButton @click="saveContent"><Save :size="14" /> 保存修改</UiButton>
            </div>
          </template>

          <!-- 预览模式 -->
          <div v-else class="markdown-preview" v-html="renderMd(selectedLesson.content)" style="max-height:60vh;overflow-y:auto;flex:1" />
        </div>

        <!-- 右：反思输入 + 记录列表 -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="editor-card" style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <p class="hero-kicker">添加反思</p>
                <h3>课堂问题记录</h3>
              </div>
              <UiButton class="mic-btn" :class="{ listening: recognition.isListening.value }" @click="toggleMic">
                <Mic v-if="!recognition.isListening.value" :size="14" />
                <MicOff v-else :size="14" />
                {{ recognition.isListening.value ? '停止' : '语音' }}
              </UiButton>
            </div>
            <div class="lesson-mic-status" :class="{ listening: recognition.isListening.value }">
              <div class="mic-live-indicator"><span></span><span></span><span></span></div>
              <p>{{ recognition.isListening.value ? '正在聆听…' : '描述课堂中发现的问题' }}</p>
            </div>
            <textarea v-model="draft" rows="4" placeholder="例如：活动说明偏晚导致展示时间不足…" />
            <p v-if="recognition.error.value" style="color:var(--danger);font-size:.78rem">{{ recognition.error.value }}</p>
            <UiButton @click="saveAnnotation" :disabled="!draft.trim()"><Save :size="14" /> 保存反思</UiButton>
          </div>

          <div class="editor-card">
            <div class="panel-headline"><h3>历史反思</h3><span class="status-pill">{{ records.length }} 条</span></div>
            <div v-if="records.length" class="card-list" style="max-height:300px;overflow-y:auto">
              <article v-for="r in (showAllRecords ? records : records.slice(0, 3))" :key="r.id" class="data-card reflection-item" style="cursor:pointer" @click="useRecord(r)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong style="font-size:.82rem">{{ r.section === 'goal' ? '教学目标' : r.section === 'localCase' ? '本地案例' : '活动设计' }}</strong>
                  <small>{{ r.time }}</small>
                </div>
                <p style="font-size:.85rem;margin:4px 0 0">{{ r.text }}</p>
              </article>
            </div>
            <p v-if="records.length > 3" class="helper-copy" style="font-size:.78rem;cursor:pointer;color:var(--primary)" @click="showAllRecords = !showAllRecords">
              {{ showAllRecords ? '收起' : `查看全部 ${records.length} 条…` }}
            </p>
            <p v-if="!records.length" class="helper-copy">暂无反思记录</p>
          </div>
        </div>
      </div>

      <!-- 移动端：教案列表 -->
      <div class="mobile-history editor-card" style="margin-top:20px">
        <div class="bookmark-head" style="margin-bottom:12px"><BookOpenText :size="16" /><strong>教案列表（{{ lessonDrafts.length }}）</strong></div>
        <div style="display:grid;gap:8px">
          <article v-for="item in lessonDrafts" :key="item.id" class="history-row" :class="{ active: selectedLessonId === item.id }" @click="selectLesson(item)">
            <strong>{{ item.title }}</strong><small>{{ item.updatedAt }}</small>
          </article>
          <p v-if="!lessonDrafts.length" class="helper-copy">暂无教案</p>
        </div>
      </div>
    </section>
  </SoloAppShell>
</template>

<style scoped>
.reflection-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; }
.mobile-history { display: none; }
@media (max-width: 1200px) {
  .mobile-history { display: block; }
}
@media (max-width: 900px) {
  .reflection-layout { grid-template-columns: 1fr; gap: 16px; }
  .reflection-layout .editor-card { padding: 16px; }
  .reflection-layout h3 { font-size: 1rem; }
  .reflection-layout textarea { font-size: 16px; }
}
@media (max-width: 640px) {
  .reflection-layout { gap: 12px; }
  .reflection-layout .editor-card { padding: 14px; }
  .mobile-history { margin-top: 12px !important; }
}
</style>
