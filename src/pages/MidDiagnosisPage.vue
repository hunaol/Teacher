<script setup>
import { computed, ref } from 'vue'
import { Camera, CheckCircle2, FileText, ListTodo, RefreshCcw, Save } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { listDiagnosisStudents, getStudentProfile, uploadDiagnosisImage, archiveDiagnosis, createDiagnosis, listDiagnoses, getHeatmap } from '../api/diagnosis'

const appName = '骨干教师端'
const pageTitle = '错题智能诊断'
const pageSubtitle = '识别学生错因、生成策略并持续维护学情样本。'
const theme = 'mid'
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function riskColor(level) {
  if (!level || level === '稳定') return '#22c55e'
  if (level === '需关注') return '#f59e0b'
  return '#ef4444'
}

function riskLevel(reportCount) {
  if (reportCount >= 8) return '高风险'
  if (reportCount >= 5) return '需关注'
  return '稳定'
}

function mapKnowledge(topicDistribution) {
  if (!topicDistribution) return []
  const entries = Object.entries(topicDistribution)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return entries.map(([name, count]) => ({
    name,
    value: Math.round((count / max) * 100),
  }))
}

function mapStudent(s) {
  const level = s.riskLevel || riskLevel(s.reportCount || 0)
  return {
    name: s.studentName || '',
    className: s.className || '',
    topic: s.latestTopic || s.subject || '',
    wrongCount: s.reportCount || 0,
    latestDate: formatDate(s.latestAt),
    level,
    color: riskColor(level),
    reason: s.latestRootCause || '',
    strategy: s.latestInterventions || '',
    archive: [],
    knowledge: [],
  }
}

const students = ref([])
const currentProfile = ref(null)
const archiveEntries = ref([])
const keyword = ref('')
const currentName = ref('')
const currentStage = ref(1)
const imagePreview = ref('')
const reportOpen = ref(false)
const loading = ref(false)
const manualOpen = ref(false)
const manualForm = ref({ studentName: '', className: '', subject: '数学', topic: '', questionText: '' })
const heatmapData = ref(null)
const heatmapOpen = ref(false)
const flatRecords = ref([])
const recordsOpen = ref(false)
const viewMode = ref('students')

const derivedStats = computed(() => {
  const highRisk = students.value.filter((s) => s.level === '高风险').length
  const totalReports = students.value.reduce((sum, s) => sum + s.wrongCount, 0)
  return [
    { label: '待处理样本', value: String(highRisk) },
    { label: '已生成建议', value: String(totalReports) },
    { label: '档案更新', value: String(archiveEntries.value.length) },
  ]
})

const filteredStudents = computed(() => {
  const key = keyword.value.trim()
  const source = [...students.value].sort((a, b) => b.wrongCount - a.wrongCount)
  if (!key) return source
  return source.filter((item) => `${item.name}${item.className}${item.topic}${item.reason}`.includes(key))
})

const current = computed(() =>
  filteredStudents.value.find((item) => item.name === currentName.value)
  || students.value.find((item) => item.name === currentName.value)
  || students.value[0],
)

const archiveCount = computed(() => archiveEntries.value.length)

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const workflow = computed(() => [
  { id: 1, title: '选学生', hint: '先从总表里点一名学生。' },
  { id: 2, title: '看分析', hint: '查看知识点、错因、措施。' },
  { id: 3, title: '存档导出', hint: '保存到学情档案并导出。' },
])

const todoList = computed(() => [
  { id: 'a', text: '选中学生', done: !!current.value },
  { id: 'b', text: '查看错因', done: currentStage.value >= 2 },
  { id: 'c', text: '保存档案', done: archiveEntries.value.length > 0 },
])

const reportSummary = computed(() => {
  if (!current.value) return ''
  return [
    `# ${current.value.name} 错题诊断单`,
    '',
    `- 班级：${current.value.className}`,
    `- 错题数：${current.value.wrongCount}`,
    `- 知识点：${current.value.topic}`,
    '',
    `## 错因`,
    current.value.reason,
    '',
    `## 改进措施`,
    current.value.strategy,
  ].join('\n')
})

async function loadStudents() {
  loading.value = true
  try {
    const list = await listDiagnosisStudents()
    students.value = list.map(mapStudent).sort((a, b) => b.wrongCount - a.wrongCount)
    if (students.value.length > 0 && !currentName.value) {
      currentName.value = students.value[0].name
    }
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
}

async function selectStudent(item) {
  currentName.value = item.name
  currentStage.value = 2
  try {
    const profile = await getStudentProfile(item.name, item.className)
    currentProfile.value = profile
    const summary = profile.summary
    if (summary) {
      const idx = students.value.findIndex((s) => s.name === item.name)
      if (idx >= 0) {
        students.value[idx] = {
          ...students.value[idx],
          reason: summary.latestRootCause || students.value[idx].reason,
          strategy: summary.latestInterventions || students.value[idx].strategy,
          knowledge: mapKnowledge(profile.topicDistribution),
        }
        students.value = [...students.value]
      }
    }
  } catch {
    // use basic student data
  }
}

function goStage(id) {
  currentStage.value = id
}

async function uploadSample(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imagePreview.value = URL.createObjectURL(file)
  const base = current.value
  if (!base) return
  try {
    const result = await uploadDiagnosisImage(file, {
      studentName: base.name,
      className: base.className,
      topic: base.topic,
    })
    const idx = students.value.findIndex((s) => s.name === base.name)
    if (idx >= 0) {
      students.value[idx] = {
        ...students.value[idx],
        wrongCount: (students.value[idx].wrongCount || 0) + 1,
        reason: result.rootCause || students.value[idx].reason,
        strategy: result.interventions || students.value[idx].strategy,
      }
    }
    students.value = [...students.value].sort((a, b) => b.wrongCount - a.wrongCount)
    currentStage.value = 2
  } catch {
    // error handled silently
  }
}

async function rerunRecognition() {
  const base = current.value
  if (!base) return
  try {
    const profile = await getStudentProfile(base.name, base.className)
    currentProfile.value = profile
    const summary = profile.summary
    if (summary) {
      const idx = students.value.findIndex((s) => s.name === base.name)
      if (idx >= 0) {
        students.value[idx] = {
          ...students.value[idx],
          reason: summary.latestRootCause || students.value[idx].reason,
          strategy: summary.latestInterventions || students.value[idx].strategy,
          knowledge: mapKnowledge(profile.topicDistribution),
        }
        students.value = [...students.value]
      }
    }
  } catch {
    // error handled silently
  }
}

async function saveStudent() {
  const base = current.value
  if (!base) return
  try {
    const reports = currentProfile.value?.reports || []
    const latestReport = reports[0]
    if (latestReport) {
      await archiveDiagnosis(latestReport.id, `${base.topic}｜${base.strategy}`)
    }
    archiveEntries.value.unshift({
      id: Date.now(),
      time: formatTime(new Date().toISOString()),
      text: `${base.topic}｜${base.strategy}`,
    })
    currentStage.value = 3
  } catch {
    // error handled silently
  }
}

async function submitManualDiagnosis() {
  if (!manualForm.value.studentName.trim()) return
  try {
    await createDiagnosis({
      studentName: manualForm.value.studentName.trim(),
      className: manualForm.value.className.trim() || undefined,
      subject: manualForm.value.subject,
      topic: manualForm.value.topic.trim() || undefined,
      questionText: manualForm.value.questionText.trim() || undefined,
    })
    manualOpen.value = false
    manualForm.value = { studentName: '', className: '', subject: '数学', topic: '', questionText: '' }
    await loadStudents()
  } catch { /* error */ }
}

async function loadFlatRecords() {
  try {
    flatRecords.value = await listDiagnoses()
    recordsOpen.value = true
  } catch { /* error */ }
}

async function loadHeatmapData() {
  try {
    heatmapData.value = await getHeatmap()
    heatmapOpen.value = true
  } catch { /* error */ }
}

loadStudents()
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems" :theme="theme">
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
        <div class="workspace-panel-head"><strong>当前学生</strong><span class="header-channel">错题诊断</span></div>
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>{{ current?.name || '未选择' }}</span></li>
          <li><span class="workspace-check"></span><span>{{ current?.topic || '-' }}</span></li>
          <li><span class="workspace-check"></span><span>已归档 {{ archiveCount }}</span></li>
        </ul>
      </UiCard>
    </template>

    <section class="feature-screen mid-ops-board mid-diagnosis-table-board">
      <section v-if="currentStage === 1" class="editor-card mid-table-card">
        <div class="panel-headline">
          <div><p class="hero-kicker">STEP 1</p><h3>先选学生</h3></div>
          <input v-model="keyword" placeholder="搜索学生/班级/知识点" />
        </div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="mid-student-table-wrap">
          <table class="mid-student-table">
            <thead><tr><th>排名</th><th>学生</th><th>班级</th><th>知识点</th><th>错题数</th><th>等级</th><th>更新</th></tr></thead>
            <tbody>
              <tr v-for="(item, index) in filteredStudents" :key="item.name" :class="{ active: currentName === item.name }" @click="selectStudent(item)">
                <td>{{ index + 1 }}</td><td>{{ item.name }}</td><td>{{ item.className }}</td><td>{{ item.topic }}</td>
                <td><span class="wrong-count-pill" :style="{ background: item.color }">{{ item.wrongCount }}</span></td>
                <td :style="{ color: item.color, fontWeight: 700 }">{{ item.level }}</td><td>{{ item.latestDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!loading && !students.length" class="helper-copy">暂无诊断数据，请先上传错题。</p>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="manualOpen = true">手动录入</UiButton>
          <UiButton variant="secondary" @click="loadFlatRecords">全部记录</UiButton>
          <UiButton variant="secondary" @click="loadHeatmapData">热力图</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 2" class="editor-card student-profile-card mid-analysis-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>{{ current?.name || '' }}</h3></div></div>
        <img v-if="imagePreview" :src="imagePreview" alt="错题样本" class="analysis-preview-image" />
        <div v-if="current?.knowledge?.length" class="knowledge-bars">
          <article v-for="item in current.knowledge" :key="item.name" class="knowledge-bar-item">
            <div><strong>{{ item.name }}</strong><small>{{ item.value }}%</small></div>
            <div class="knowledge-track"><span :style="{ width: `${item.value}%` }"></span></div>
          </article>
        </div>
        <textarea v-model="current.reason" rows="4"></textarea>
        <textarea v-model="current.strategy" rows="4"></textarea>
        <div class="bottom-action-bar">
          <label class="ui-btn ui-btn-secondary mid-upload-btn"><input type="file" accept="image/*" class="hidden-file" @change="uploadSample" /><Camera :size="16" /> 上传新错题</label>
          <UiButton variant="secondary" @click="rerunRecognition"><RefreshCcw :size="16" /> 重新分析</UiButton>
          <UiButton @click="saveStudent"><Save :size="16" /> 下一步</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline">
          <div><p class="hero-kicker">STEP 3</p><h3>存档与导出</h3></div>
          <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(reportSummary)}`" download="学生错题诊断单.txt"><FileText :size="16" /> 导出给学生</UiButton>
        </div>
        <div class="card-list">
          <article v-for="item in archiveEntries" :key="item.id" class="data-card"><strong>{{ item.time }}</strong><p>{{ item.text }}</p></article>
          <article v-if="!archiveEntries.length" class="data-card"><strong>暂无记录</strong></article>
        </div>
        <div class="bottom-action-bar"><UiButton variant="secondary" @click="reportOpen = true">预览导出</UiButton></div>
      </section>

      <UiDialog v-model:open="reportOpen" title="导出预览" description="">
        <div class="preview-paper"><pre>{{ reportSummary }}</pre></div>
      </UiDialog>

      <UiDialog v-model:open="manualOpen" title="手动录入诊断" description="">
        <div class="login-form-clean">
          <input v-model="manualForm.studentName" placeholder="学生姓名" />
          <input v-model="manualForm.className" placeholder="班级（如六1班）" />
          <input v-model="manualForm.subject" placeholder="学科" />
          <input v-model="manualForm.topic" placeholder="知识点" />
          <textarea v-model="manualForm.questionText" rows="3" placeholder="题目描述"></textarea>
          <UiButton @click="submitManualDiagnosis">提交诊断</UiButton>
        </div>
      </UiDialog>

      <UiDialog v-model:open="recordsOpen" title="全部诊断记录" description="">
        <div class="card-list">
          <article v-for="r in flatRecords.slice(0, 20)" :key="r.id" class="data-card">
            <strong>{{ r.studentName }} · {{ r.topic }}</strong>
            <small>{{ formatDate(r.createdAt) }}</small>
            <p>{{ r.rootCause || '暂无分析' }}</p>
          </article>
          <p v-if="!flatRecords.length">暂无记录</p>
        </div>
      </UiDialog>

      <UiDialog v-model:open="heatmapOpen" title="班级热力图" description="">
        <div v-if="heatmapData">
          <p><strong>班级：</strong>{{ heatmapData.className || '全部' }}</p>
          <p><strong>总报告数：</strong>{{ heatmapData.totalReports }}</p>
          <p><strong>高风险学生：</strong>{{ heatmapData.highRiskStudents }}</p>
          <div v-if="heatmapData.topics?.length" class="card-list" style="margin-top:12px">
            <article v-for="t in heatmapData.topics" :key="t.topic" class="data-card">
              <strong>{{ t.topic }}</strong>
              <small>{{ t.count }} 次 · {{ t.level || '-' }}</small>
            </article>
          </div>
        </div>
        <p v-else>加载中…</p>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
