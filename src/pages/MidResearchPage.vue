<script setup>
import { computed, ref, watch, onMounted, onErrorCaptured } from 'vue'
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, ListTodo, Search, Send, Telescope, Upload, Eye, Trash2 } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { listResources, createResource, watchResource } from '../api/resource'
import { recommendTopic, listTopics, saveTopic, updateTopic, deleteTopic } from '../api/research'

const appName = '骨干教师端'
const pageTitle = '课题研究导航'
const pageSubtitle = '从教案资源中提炼研究课题'
const theme = 'mid'
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

const categoryList = ['全部', '语文', '数学', '综合实践', '科学']

const docLibrary = ref([])
const topicLibrary = ref([])
const loadingDocs = ref(false)
const loadError = ref(false)

onErrorCaptured((err) => {
  loadError.value = true
  return false
})

const selectedDocIds = ref(new Set())
const selectedTopic = ref({ title: '', meta: '', extra: '', sources: [], applicationDraft: '', createdAt: '' })
const keyword = ref('')
const category = ref('全部')
const activeTopicId = ref(null)
const currentStage = ref(1)

const uploadOpen = ref(false)
const uploadForm = ref({ title: '', summary: '', content: '', subject: '数学', grade: '' })
const uploading = ref(false)
const uploadError = ref('')
const isGenerating = ref(false)

const derivedStats = computed(() => [
  { label: '在研课题', value: String(topicLibrary.value.length) },
  { label: '可用教案', value: String(docLibrary.value.length) },
  { label: '已选来源', value: String(selectedDocIds.value.size) },
])

const filteredDocs = computed(() => {
  const v = keyword.value.trim()
  const src = Array.isArray(docLibrary.value) ? docLibrary.value : []
  return src.filter((item) => {
    if (!item) return false
    const mCat = category.value === '全部' || item.subject === category.value
    const mKw = !v || `${item.title || ''}${item.subject || ''}${item.grade || ''}`.includes(v)
    return mCat && mKw
  })
})

const selectedDocs = computed(() =>
  (Array.isArray(docLibrary.value) ? docLibrary.value : []).filter((d) => d && selectedDocIds.value.has(d.id))
)

const activeTopicDetail = ref(null)

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const workflow = computed(() => [
  { id: 1, title: '选择教案来源', hint: '从资源库挑选或上传新教案' },
  { id: 2, title: '编辑研究课题', hint: 'AI 推荐 + 手动完善' },
  { id: 3, title: '我的课题库', hint: '查看管理所有课题' },
])

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadDocLibrary() {
  loadingDocs.value = true
  try {
    const params = { resourceType: 'lesson', all: true }
    if (category.value !== '全部') params.subject = category.value
    docLibrary.value = Array.isArray(await listResources(params)) ? (await listResources(params)).filter(Boolean) : []
  } catch { docLibrary.value = [] } finally { loadingDocs.value = false }
}

async function loadTopics() {
  try {
    const list = await listTopics()
    topicLibrary.value = Array.isArray(list) ? list.filter(Boolean).map((t) => ({ ...t, sources: t.sources ? t.sources.split(',') : [] })) : []
  } catch { topicLibrary.value = [] }
}

watch(category, () => loadDocLibrary())

function goStage(id) { currentStage.value = id }

async function submitUpload() {
  if (!uploadForm.value.title.trim()) return
  uploading.value = true; uploadError.value = ''
  /* 先加入本地列表 */
  const localId = Date.now()
  docLibrary.value.unshift({
    id: localId, title: uploadForm.value.title.trim(), summary: uploadForm.value.summary.trim(),
    subject: uploadForm.value.subject, grade: uploadForm.value.grade,
    school: '', createdAt: new Date().toISOString(), likes: 0, favoriteCount: 0, commentCount: 0,
  })
  uploadOpen.value = false
  uploadForm.value = { title: '', summary: '', content: '', subject: '数学', grade: '' }
  ElMessage.success('教案已上传')
  /* 异步同步后端 */
  try {
    const created = await createResource({ title: uploadForm.value.title || '', summary: uploadForm.value.summary || '', subject: uploadForm.value.subject, grade: uploadForm.value.grade, resourceType: 'lesson' })
    if (created?.id) {
      const idx = docLibrary.value.findIndex((d) => d.id === localId)
      if (idx >= 0) docLibrary.value[idx].id = created.id
    }
  } catch { /* 本地已生效 */ }
  uploading.value = false
}

function toggleDoc(item) {
  if (selectedDocIds.value.has(item.id)) selectedDocIds.value.delete(item.id)
  else { selectedDocIds.value.add(item.id); try { watchResource(item.id) } catch { /* */ } }
  selectedDocIds.value = new Set(selectedDocIds.value)
}

async function buildRecommendation() {
  const sources = selectedDocs.value
  if (!sources.length) return ElMessage.warning('请先选择教案')
  const sourceTitles = sources.map((s) => s.title)
  isGenerating.value = true
  currentStage.value = 2
  try {
    const result = await recommendTopic({ teacherGoal: keyword.value || undefined, sources: sourceTitles })
    let rec = {}; try { rec = JSON.parse(result.recommendationJson || '{}') } catch { /* */ }
    selectedTopic.value = { title: rec.title || `基于 ${sources.length} 篇教案的研究课题`, meta: rec.meta || '', extra: rec.extra || '', sources: rec.sources || sourceTitles, applicationDraft: rec.applicationDraft || '', transformed: false, createdAt: '' }
    if (result.savedTopic) topicLibrary.value.unshift({ ...result.savedTopic, sources: result.savedTopic.sources ? result.savedTopic.sources.split(',') : [] })
  } catch {
    selectedTopic.value = { title: `基于 ${sources.length} 篇教案的研究课题`, meta: '', extra: '', sources: sourceTitles, applicationDraft: '', transformed: false, createdAt: '' }
  } finally { isGenerating.value = false }
}

async function saveTopicToServer() {
  if (!selectedTopic.value.title.trim()) return ElMessage.warning('请输入课题名称')
  /* 先生成本地 ID */
  const localId = Date.now()
  const localItem = {
    id: localId, title: selectedTopic.value.title, meta: selectedTopic.value.meta,
    extra: selectedTopic.value.extra,
    sources: Array.isArray(selectedTopic.value.sources) ? selectedTopic.value.sources : [],
    createdAt: new Date().toISOString(),
  }
  topicLibrary.value.unshift(localItem)
  activeTopicId.value = localId; activeTopicDetail.value = localItem
  currentStage.value = 3
  ElMessage.success('课题已保存')
  /* 异步同步后端 */
  try {
    const saved = await saveTopic({ title: selectedTopic.value.title, meta: selectedTopic.value.meta, extra: selectedTopic.value.extra, sources: Array.isArray(selectedTopic.value.sources) ? selectedTopic.value.sources.join(',') : selectedTopic.value.sources, applicationDraft: selectedTopic.value.applicationDraft || '' })
    if (saved?.id) {
      localItem.id = saved.id; activeTopicId.value = saved.id
      activeTopicDetail.value = { ...localItem, id: saved.id }
    }
  } catch { /* 本地已保存 */ }
}

function openTopic(item) {
  activeTopicId.value = item.id
  const sources = Array.isArray(item.sources) ? item.sources : (typeof item.sources === 'string' ? item.sources.split(',') : [])
  activeTopicDetail.value = { ...item, sources }
  currentStage.value = 3
}

function removeSource(idx) {
  const s = [...(selectedTopic.value.sources || [])]; s.splice(idx, 1)
  selectedTopic.value = { ...selectedTopic.value, sources: s }
}

/* 课题管理弹窗 */
const topicManageOpen = ref(false)
const editingTopicId = ref(null)
const editTopicForm = ref({ title: '', meta: '', extra: '' })
function openTopicManage() {
  loadTopics()
  topicManageOpen.value = true
}

function startEditTopic(item) {
  editingTopicId.value = item.id
  editTopicForm.value = { title: item.title || '', meta: item.meta || '', extra: item.extra || '' }
}

function cancelEdit() {
  editingTopicId.value = null
  editTopicForm.value = { title: '', meta: '', extra: '' }
}

async function saveEditTopic() {
  if (!editingTopicId.value) return
  /* 先更新本地 */
  const idx = topicLibrary.value.findIndex((t) => t.id === editingTopicId.value)
  if (idx >= 0) {
    topicLibrary.value[idx] = { ...topicLibrary.value[idx], ...editTopicForm.value }
    topicLibrary.value = [...topicLibrary.value]
    if (activeTopicDetail.value?.id === editingTopicId.value) {
      activeTopicDetail.value = { ...activeTopicDetail.value, ...editTopicForm.value }
    }
  }
  ElMessage.success('课题已更新')
  cancelEdit()
  /* 异步同步后端 */
  try { await updateTopic(editingTopicId.value, editTopicForm.value) } catch { /* 本地已生效 */ }
}

async function handleDeleteTopic(id) {
  /* 先从本地移除 */
  topicLibrary.value = topicLibrary.value.filter((t) => t.id !== id)
  if (activeTopicId.value === id) { activeTopicId.value = null; activeTopicDetail.value = null }
  ElMessage.success('课题已删除')
  /* 异步同步后端 */
  try { await deleteTopic(id) } catch { /* 本地已生效 */ }
}

function viewTopic(item) {
  topicManageOpen.value = false
  openTopic(item)
}

onMounted(() => { loadDocLibrary(); loadTopics() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" :subtitle="pageSubtitle" :stats="derivedStats" :nav-items="navItems" :theme="theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head"><ListTodo :size="16" /><strong>研究流程</strong></div>
          <div class="bookmark-progress"><UiProgress :value="navProgress" /></div>
          <button v-for="item in workflow" :key="item.id" type="button" class="bookmark-item" :class="{ active: currentStage === item.id }" @click="goStage(item.id)">
            <span class="bookmark-index">{{ item.id }}</span>
            <div><strong>{{ item.title }}</strong><p>{{ item.hint }}</p></div>
          </button>
        </div>

        <div class="bookmark-card">
          <div class="bookmark-head"><FileText :size="16" /><strong>课题快捷入口</strong></div>
          <article v-for="item in topicLibrary.slice(0, 6)" :key="item.id" class="history-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
            <strong>{{ item.title }}</strong><small>{{ formatDate(item.createdAt) }}</small>
          </article>
          <p v-if="!topicLibrary.length" class="helper-copy" style="font-size:.78rem">暂无课题</p>
        </div>
      </aside>
    </template>

    <section class="feature-screen mid-research-archive-board" style="width:100%">
      <div v-if="loadError" class="editor-card"><p>页面加载出错</p></div>

      <!-- ====== STEP 1 ====== -->
      <section v-if="currentStage === 1">
        <div class="editor-card" style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <p class="hero-kicker">教案资源库</p>
              <h3>选择教案作为课题来源</h3>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <UiButton @click="openTopicManage"><Eye :size="14" /> 查看所有课题</UiButton>
              <UiButton variant="primary" @click="uploadOpen = true"><Upload :size="14" /> 上传教案</UiButton>
              <UiButton @click="buildRecommendation" :disabled="!selectedDocIds.size" :loading="isGenerating">
                {{ isGenerating ? 'AI 分析中…' : '生成课题' }} <ArrowRight :size="14" />
              </UiButton>
            </div>
          </div>
        </div>

        <!-- 搜索栏 -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
          <label class="old-library-search" style="flex:1;min-width:180px">
            <Search :size="15" /><input v-model="keyword" placeholder="搜索教案…" />
          </label>
          <span v-if="selectedDocIds.size" class="status-pill" style="background:var(--primary-light);color:var(--primary-strong);border-color:var(--primary)">
            已选 {{ selectedDocIds.size }} 篇
          </span>
        </div>
        <div class="old-library-tags">
          <button v-for="item in categoryList" :key="item" class="old-library-tag" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
        </div>

        <!-- 教案卡片 -->
        <p v-if="loadingDocs" class="helper-copy">加载中…</p>
        <div v-else class="old-library-grid">
          <article v-for="item in filteredDocs" :key="item.id" class="old-doc-card research-doc-card" :class="{ active: selectedDocIds.has(item.id) }" @click="toggleDoc(item)">
            <div class="old-doc-cover research-doc-cover">
              <FileText :size="28" />
              <span v-if="selectedDocIds.has(item.id)" class="research-check-badge">✓</span>
            </div>
            <div class="old-doc-body">
              <strong>{{ item.title }}</strong>
              <p style="font-size:.82rem">{{ item.summary || '暂无简介' }}</p>
              <div class="research-doc-meta">
                <span>{{ item.subject }}</span><span>{{ item.grade }}</span>
                <span v-if="item.school">{{ item.school }}</span>
              </div>
            </div>
          </article>
          <p v-if="!loadingDocs && !filteredDocs.length" class="helper-copy" style="grid-column:1/-1;padding:32px">暂无教案，点击"上传教案"添加</p>
        </div>
      </section>

      <!-- ====== STEP 2 ====== -->
      <section v-if="currentStage === 2">
        <!-- 返回按钮 -->
        <div style="margin-bottom:14px">
          <UiButton variant="ghost" @click="currentStage = 1"><ArrowLeft :size="14" /> 返回重新选择教案</UiButton>
        </div>

        <div class="editor-card">
          <div class="panel-headline" style="margin-bottom:16px">
            <div><p class="hero-kicker">编辑课题</p><h3>完善研究课题信息</h3></div>
          </div>

          <!-- 已选来源 -->
          <div v-if="selectedDocs.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            <span v-for="item in selectedDocs" :key="item.id" class="ui-tag ui-tag-primary" style="font-size:.78rem">
              {{ item.title }}
              <button @click="toggleDoc(item)" style="background:none;border:none;cursor:pointer;padding:0 2px;opacity:.6">&times;</button>
            </span>
          </div>

          <div class="research-form">
            <div class="profile-form-field">
              <label>研究选题 <span style="color:var(--danger)">*</span></label>
              <input v-model="selectedTopic.title" placeholder="例：乡村小学数学情境教学实践研究" />
            </div>
            <div class="profile-form-field">
              <label>选题依据</label>
              <textarea v-model="selectedTopic.meta" rows="3" placeholder="为什么要选这个课题？教学中发现了什么问题？"></textarea>
            </div>
            <div class="profile-form-field">
              <label>研究计划</label>
              <textarea v-model="selectedTopic.extra" rows="4" placeholder="怎么做？包括研究步骤、方法、预期成果…"></textarea>
            </div>
          </div>

          <div class="bottom-action-bar" style="padding-top:14px;border-top:1px solid var(--border-light)">
            <UiButton variant="secondary" @click="buildRecommendation" :loading="isGenerating">🔄 AI 重新推荐</UiButton>
            <UiButton @click="saveTopicToServer"><FileText :size="14" /> 保存课题</UiButton>
          </div>
        </div>
      </section>

      <!-- ====== STEP 3 ====== -->
      <section v-if="currentStage === 3">
        <div style="margin-bottom:14px">
          <UiButton variant="ghost" @click="currentStage = 1"><ArrowLeft :size="14" /> 返回资源库</UiButton>
        </div>

        <div class="editor-card" style="margin-bottom:16px">
          <div class="panel-headline"><h3>我的课题库（{{ topicLibrary.length }}）</h3></div>
          <div v-if="!topicLibrary.length" class="helper-copy" style="padding:40px">
            <FileText :size="32" style="color:var(--text-faint);margin-bottom:12px" />
            <p>还没有课题</p>
            <UiButton variant="secondary" @click="currentStage = 1" style="margin-top:8px">去选择教案</UiButton>
          </div>
          <div v-else class="my-topic-list">
            <article v-for="item in topicLibrary" :key="item.id" class="my-topic-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%">
                <div style="flex:1;min-width:0">
                  <strong>{{ item.title }}</strong>
                  <p style="margin:4px 0 0;font-size:.8rem;color:var(--text-soft)">{{ item.meta ? item.meta.slice(0, 80) + (item.meta.length > 80 ? '…' : '') : '暂无依据' }}</p>
                </div>
                <small style="flex-shrink:0;margin-left:12px;margin-top:2px">{{ formatDate(item.createdAt) }}</small>
              </div>
            </article>
          </div>
        </div>

        <!-- 选中课题详情 -->
        <div v-if="activeTopicDetail" class="editor-card" style="background:var(--bg-soft)">
          <div class="panel-headline" style="margin-bottom:12px">
            <h3>{{ activeTopicDetail.title }}</h3>
            <span class="status-pill" v-if="activeTopicDetail.createdAt">{{ formatDate(activeTopicDetail.createdAt) }}</span>
          </div>
          <div style="display:grid;gap:14px;font-size:.9rem;line-height:1.7">
            <div v-if="activeTopicDetail.meta"><strong>选题依据</strong><p style="white-space:pre-wrap;margin-top:4px">{{ activeTopicDetail.meta }}</p></div>
            <div v-if="activeTopicDetail.extra"><strong>研究计划</strong><p style="white-space:pre-wrap;margin-top:4px">{{ activeTopicDetail.extra }}</p></div>
            <div v-if="activeTopicDetail.sources?.length"><strong>参考教案</strong><p style="margin-top:4px">{{ activeTopicDetail.sources.join('、') }}</p></div>
          </div>
        </div>
      </section>

      <!-- 上传弹窗 -->
      <UiDialog v-model:open="uploadOpen" title="上传教案">
        <div class="login-form-clean">
          <div class="profile-form-field"><label>教案标题 <span style="color:var(--danger)">*</span></label><input v-model="uploadForm.title" placeholder="如：五年级《分数加减法》教案" /></div>
          <div class="profile-form-field"><label>简介</label><textarea v-model="uploadForm.summary" rows="2" placeholder="简要描述…" /></div>
          <div class="profile-form-field"><label>内容（可选）</label><textarea v-model="uploadForm.content" rows="3" placeholder="教案 Markdown 正文…" /></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="profile-form-field"><label>学科</label><input v-model="uploadForm.subject" placeholder="数学" /></div>
            <div class="profile-form-field"><label>年级</label><input v-model="uploadForm.grade" placeholder="五年级" /></div>
          </div>
          <p v-if="uploadError" style="color:var(--danger);font-size:.82rem">{{ uploadError }}</p>
          <UiButton @click="submitUpload" :loading="uploading" block>{{ uploading ? '上传中…' : '确认上传' }}</UiButton>
        </div>
      </UiDialog>

      <!-- 课题管理弹窗 -->
      <UiDialog v-model:open="topicManageOpen" title="我的所有课题" size="lg">
        <div v-if="!topicLibrary.length" class="helper-copy" style="padding:32px">
          <p>还没有课题，请先选择教案并创建</p>
        </div>
        <div v-else class="card-list" style="max-height:60vh;overflow-y:auto;overscroll-behavior:contain">
          <article v-for="item in topicLibrary" :key="item.id" class="data-card" style="display:grid;gap:8px">
            <!-- 查看/编辑模式 -->
            <template v-if="editingTopicId === item.id">
              <input v-model="editTopicForm.title" placeholder="课题名称" style="font-weight:600" />
              <textarea v-model="editTopicForm.meta" rows="2" placeholder="选题依据" />
              <textarea v-model="editTopicForm.extra" rows="2" placeholder="研究计划" />
              <div style="display:flex;gap:6px">
                <UiButton size="sm" @click="saveEditTopic">保存</UiButton>
                <UiButton size="sm" variant="secondary" @click="cancelEdit">取消</UiButton>
              </div>
            </template>
            <!-- 显示模式 -->
            <template v-else>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div style="flex:1;min-width:0">
                  <strong>{{ item.title }}</strong>
                  <p style="font-size:.82rem;margin:4px 0">{{ item.meta ? item.meta.slice(0, 100) : '暂无依据' }}</p>
                  <small>{{ formatDate(item.createdAt) }}</small>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                  <button class="choice-btn" style="font-size:.75rem;min-height:28px;padding:0 10px" @click="startEditTopic(item)">编辑</button>
                  <button class="choice-btn" style="font-size:.75rem;min-height:28px;padding:0 10px;color:var(--danger)" @click="handleDeleteTopic(item.id)">删除</button>
                  <button class="choice-btn" style="font-size:.75rem;min-height:28px;padding:0 10px" @click="viewTopic(item)">查看</button>
                </div>
              </div>
            </template>
          </article>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>

<style scoped>
.research-doc-card { position: relative; }
.research-doc-cover { position: relative; background: linear-gradient(135deg, var(--bg-soft), var(--primary-light)); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.research-check-badge { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 700; }
.research-doc-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.research-doc-meta span { padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-soft); font-size: .72rem; color: var(--text-soft); }
.research-form { display: grid; gap: 16px; }
.research-form .profile-form-field label { display: block; font-size: .85rem; font-weight: 500; color: var(--text); margin-bottom: 6px; }
.research-form input, .research-form textarea { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: .92rem; color: var(--text); background: var(--surface); outline: none; font-family: inherit; transition: border .2s, box-shadow .2s; }
.research-form input:focus, .research-form textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(217,140,82,.12); }
</style>
