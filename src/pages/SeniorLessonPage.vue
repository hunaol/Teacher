<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Mic, MicOff, Sparkles, Save, Trash2, Edit3, FileText } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSeniorLessonStore } from '../composables/useSeniorLessonStore'

const { drafts: savedDrafts, loading, generateLesson, buildDraftContent, addDraft, updateDraft, removeDraft } = useSeniorLessonStore()

const appName = '老年资深教师端'
const pageTitle = '智能语音备课'
const pageSubtitle = '输入教学需求，AI 自动生成结构化教案'
const theme = 'senior'
const navItems = [
  { name: '备课', path: '/senior/lesson', icon: '备' },
  { name: '反思', path: '/senior/reflection', icon: '思' },
]

const voiceInput = ref('')
const generatedContent = ref('')
const editableTitle = ref('')
const editableContent = ref('')
const isGenerating = ref(false)
const generateStatus = ref('')
const selectedId = ref(null)
const viewMode = ref('edit')

const recognition = useSpeechRecognition()

watch(() => recognition.liveText.value, (v) => {
  if (recognition.isListening.value && v) voiceInput.value = v
})

const derivedStats = computed(() => [
  { label: '教案总数', value: String(savedDrafts.value.length) },
  { label: '今日生成', value: '—' },
  { label: '最近编辑', value: savedDrafts.value[0]?.title?.slice(0, 6) || '—' },
])

const selectedDraft = computed(() =>
  savedDrafts.value.find((d) => d.id === selectedId.value) ?? null
)

function toggleMic() {
  if (recognition.isListening.value) { recognition.stop(); return }
  recognition.reset(voiceInput.value)
  recognition.start()
}

async function handleGenerate() {
  if (!voiceInput.value.trim()) return
  isGenerating.value = true
  generateStatus.value = 'AI 正在生成教案…'
  try {
    const result = await generateLesson(voiceInput.value)
    generatedContent.value = result.markdown || buildDraftContent(voiceInput.value)
    editableTitle.value = '教案草稿-' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    editableContent.value = generatedContent.value
    generateStatus.value = '生成完成'
    ElMessage.success('教案生成成功')
  } catch (e) {
    generatedContent.value = buildDraftContent(voiceInput.value)
    editableContent.value = generatedContent.value
    generateStatus.value = ''
    ElMessage.warning('AI 生成失败，已使用模板，可手动编辑')
  } finally {
    isGenerating.value = false
  }
}

async function handleSave() {
  if (!editableContent.value.trim()) return
  try {
    if (selectedId.value) {
      await updateDraft(selectedId.value, {
        title: editableTitle.value || '未命名',
        content: editableContent.value,
        summary: '已编辑',
      })
      ElMessage.success('教案已更新')
    } else {
      await addDraft({
        title: editableTitle.value || '教案草稿',
        summary: '新生成',
        content: editableContent.value,
        annotations: { goal: [], localCase: [], activity: [] },
      })
      if (savedDrafts.value.length > 0) selectedId.value = savedDrafts.value[0].id
      ElMessage.success('教案已保存')
    }
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

function selectDraft(item) {
  selectedId.value = item.id
  editableTitle.value = item.title
  editableContent.value = item.content
}

async function handleDelete(id) {
  await removeDraft(id)
  if (selectedId.value === id) newLesson()
  ElMessage.success('教案已删除')
}

function newLesson() {
  selectedId.value = null
  editableTitle.value = ''
  editableContent.value = ''
  generatedContent.value = ''
  voiceInput.value = ''
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
          <div class="bookmark-head"><FileText :size="16" /><strong>历史教案</strong></div>
          <p v-if="loading" class="helper-copy">加载中…</p>
          <article v-for="item in savedDrafts" :key="item.id" class="history-row" :class="{ active: selectedId === item.id }" @click="selectDraft(item)">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.updatedAt }}</small>
              </div>
              <button class="choice-btn" style="font-size:.7rem;min-height:26px;padding:0 8px;flex-shrink:0" @click.stop="handleDelete(item.id)">
                <Trash2 :size="12" />
              </button>
            </div>
          </article>
          <p v-if="!loading && !savedDrafts.length" class="helper-copy">暂无教案</p>
        </div>
      </aside>
    </template>

    <section class="feature-screen senior-workbench">
      <div class="lesson-layout">
        <!-- 左：输入区 -->
        <div class="editor-card" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p class="hero-kicker">输入需求</p>
              <h3>描述你的备课需求</h3>
            </div>
            <UiButton class="mic-btn" :class="{ listening: recognition.isListening.value }" @click="toggleMic">
              <Mic v-if="!recognition.isListening.value" :size="16" />
              <MicOff v-else :size="16" />
              {{ recognition.isListening.value ? '停止' : '语音输入' }}
            </UiButton>
          </div>
          <div class="lesson-mic-status" :class="{ listening: recognition.isListening.value }">
            <div class="mic-live-indicator"><span></span><span></span><span></span></div>
            <p>{{ recognition.isListening.value ? '正在聆听…' : '说出学段、目标、本地案例和活动需求' }}</p>
          </div>
          <textarea v-model="voiceInput" rows="6" placeholder="例如：五年级数学，围绕秋收农事设计分数加减法教案，包含小组合作活动…" />
          <p v-if="recognition.error.value" style="color:var(--danger);font-size:.82rem">{{ recognition.error.value }}</p>
          <UiButton variant="primary" size="lg" block @click="handleGenerate" :loading="isGenerating">
            <Sparkles :size="16" /> {{ isGenerating ? '生成中…' : '确认生成教案' }}
          </UiButton>
          <p v-if="generateStatus" style="text-align:center;font-size:.82rem;color:var(--primary-strong)">{{ generateStatus }}</p>
        </div>

        <!-- 右：预览/编辑区 -->
        <div class="editor-card" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p class="hero-kicker">教案内容</p>
              <h3>{{ editableTitle || '待生成' }}</h3>
            </div>
            <div style="display:flex;gap:6px">
              <button class="choice-btn" :class="{ active: viewMode === 'edit' }" @click="viewMode = 'edit'">编辑</button>
              <button class="choice-btn" :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'">预览</button>
            </div>
          </div>

          <input v-if="viewMode === 'edit'" v-model="editableTitle" placeholder="教案标题" style="margin-bottom:4px" />
          <textarea v-if="viewMode === 'edit'" v-model="editableContent" rows="20" placeholder="生成后内容会显示在这里，可直接编辑…" />
          <div v-else class="markdown-preview" v-html="renderMd(editableContent)" style="min-height:300px;flex:1" />

          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="newLesson"><Edit3 :size="14" /> 新建</UiButton>
            <UiButton @click="handleSave" :disabled="!editableContent.trim()"><Save :size="14" /> 保存教案</UiButton>
          </div>
        </div>
      </div>

      <!-- 历史教案列表（移动端可见） -->
      <div class="mobile-history editor-card" style="margin-top:20px">
        <div class="bookmark-head" style="margin-bottom:12px"><FileText :size="16" /><strong>历史教案（{{ savedDrafts.length }}）</strong></div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else style="display:grid;gap:8px">
          <article v-for="item in savedDrafts" :key="item.id" class="history-row" :class="{ active: selectedId === item.id }" @click="selectDraft(item)">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.updatedAt }}</small>
              </div>
              <button class="choice-btn" style="font-size:.7rem;min-height:26px;padding:0 8px" @click.stop="handleDelete(item.id)">
                <Trash2 :size="12" />
              </button>
            </div>
          </article>
          <p v-if="!savedDrafts.length" class="helper-copy">暂无教案</p>
        </div>
      </div>
    </section>
  </SoloAppShell>
</template>

<style scoped>
.lesson-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; }
/* 移动端历史教案列表：桌面端由左侧栏显示，移动端在底部显示 */
.mobile-history { display: none; }
@media (max-width: 1200px) {
  .mobile-history { display: block; }
}
@media (max-width: 900px) {
  .lesson-layout { grid-template-columns: 1fr; gap: 16px; }
  .lesson-layout .editor-card { padding: 16px; }
  .lesson-layout h3 { font-size: 1rem; }
  .lesson-layout textarea { font-size: 16px; }
}
@media (max-width: 640px) {
  .lesson-layout { gap: 12px; }
  .lesson-layout .editor-card { padding: 14px; }
  .mobile-history { margin-top: 12px !important; }
}
</style>
