<script setup>
/**
 * MidDiagnosisPage.vue — 错题智能诊断页面（骨干教师端）
 * ========================================================
 * 功能概述：
 *   1. 展示学生诊断总表（按错题数排序），支持搜索筛选
 *   2. 三步工作流：选学生 → 看分析（知识点/错因/措施） → 存档导出
 *   3. 支持上传错题图片、手动录入诊断、查看全部记录和班级热力图
 *   4. 对接后端诊断API，实现学生画像获取、错因识别、档案归档等
 */

// ==================== 依赖导入 ====================

// Vue组合式API
import { computed, ref } from 'vue'

// Lucide图标组件（用于按钮和状态指示）
import { Camera, CheckCircle2, FileText, ListTodo, RefreshCcw, Save } from 'lucide-vue-next'

// 布局与UI基础组件
import SoloAppShell from '../components/SoloAppShell.vue'   // 单页应用外壳（导航+侧边栏+内容区）
import UiButton from '../components/ui/UiButton.vue'         // 通用按钮组件
import UiCard from '../components/ui/UiCard.vue'             // 通用卡片组件
import UiDialog from '../components/ui/UiDialog.vue'         // 通用弹窗组件
import UiProgress from '../components/ui/UiProgress.vue'     // 通用进度条组件

// 诊断相关API接口
import {
  listDiagnosisStudents,   // 获取诊断学生列表
  getStudentProfile,       // 获取单个学生诊断画像
  uploadDiagnosisImage,    // 上传错题图片并获取AI分析结果
  archiveDiagnosis,        // 将诊断结果归档到学情档案
  createDiagnosis,         // 手动创建诊断记录
  listDiagnoses,           // 获取全部诊断记录（扁平列表）
  getHeatmap,              // 获取班级热力图数据
} from '../api/diagnosis'

// ==================== 页面静态配置 ====================

/** 应用名称，显示在页面头部 */
const appName = '骨干教师端'

/** 页面标题 */
const pageTitle = '错题智能诊断'

/** 页面副标题（描述说明） */
const pageSubtitle = '识别学生错因、生成策略并持续维护学情样本。'

/** 主题标识，用于SoloAppShell的样式切换 */
const theme = 'mid'

/** 导航菜单项配置 */
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

// ==================== 工具函数 ====================

/**
 * 将ISO日期字符串格式化为 MM-DD 短格式
 * @param {string} iso - ISO格式的日期字符串
 * @returns {string} 格式化后的日期，如 "01-15"；无输入时返回空字符串
 */
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 将ISO时间字符串格式化为 "今天 HH:MM" 格式
 * @param {string} iso - ISO格式的时间字符串
 * @returns {string} 如 "今天 14:30"；无输入时返回空字符串
 */
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 根据风险等级返回对应的显示颜色
 * - 稳定 → 绿色 #22c55e
 * - 需关注 → 橙色 #f59e0b
 * - 高风险 → 红色 #ef4444
 * @param {string} level - 风险等级标识
 * @returns {string} 对应的CSS颜色值
 */
function riskColor(level) {
  if (!level || level === '稳定') return '#22c55e'
  if (level === '需关注') return '#f59e0b'
  return '#ef4444'
}

/**
 * 根据错题报告数量判定风险等级
 * - >= 8 题 → 高风险
 * - >= 5 题 → 需关注
 * - 其他 → 稳定
 * @param {number} reportCount - 错题报告数量
 * @returns {string} 风险等级标识
 */
function riskLevel(reportCount) {
  if (reportCount >= 8) return '高风险'
  if (reportCount >= 5) return '需关注'
  return '稳定'
}

/**
 * 将知识点分布对象转换为可视化条形图所需的数据格式
 * 以最大值为100%计算各知识点的相对百分比
 * @param {Object} topicDistribution - 知识点到数量的映射，如 { "分数运算": 5, "方程求解": 3 }
 * @returns {Array<{name: string, value: number}>} 各知识点的名称和百分比值
 */
function mapKnowledge(topicDistribution) {
  if (!topicDistribution) return []
  const entries = Object.entries(topicDistribution)
  const max = Math.max(...entries.map(([, v]) => v), 1) // 避免除零，最小为1
  return entries.map(([name, count]) => ({
    name,
    value: Math.round((count / max) * 100),
  }))
}

/**
 * 将后端返回的学生原始数据映射为页面展示所需的统一格式
 * @param {Object} s - 后端返回的学生原始数据
 * @returns {Object} 包含 name, className, topic, wrongCount, latestDate, level, color, reason, strategy 等字段
 */
function mapStudent(s) {
  const level = s.riskLevel || riskLevel(s.reportCount || 0)
  return {
    name: s.studentName || '',
    className: s.className || '',
    topic: s.latestTopic || s.subject || '',           // 最近出错的知识点/学科
    wrongCount: s.reportCount || 0,                     // 错题报告总数
    latestDate: formatDate(s.latestAt),                 // 最新更新时间（格式化后）
    level,                                              // 风险等级
    color: riskColor(level),                            // 对应颜色
    reason: s.latestRootCause || '',                    // 最新错因分析
    strategy: s.latestInterventions || '',              // 最新改进措施
    archive: [],                                        // 本地归档记录（初始为空）
    knowledge: [],                                      // 知识点分布（初始为空，加载画像后填充）
  }
}

// ==================== 响应式状态 ====================

/** 学生诊断列表（全量数据，经过mapStudent映射后的数组） */
const students = ref([])

/** 当前选中学生的详细画像数据（包含报告历史等） */
const currentProfile = ref(null)

/** 本地归档记录列表（已保存到学情档案的诊断） */
const archiveEntries = ref([])

/** 搜索关键词（用于学生表的筛选过滤） */
const keyword = ref('')

/** 当前选中学生的姓名（用于高亮和匹配） */
const currentName = ref('')

/** 当前工作流步骤：1-选学生 / 2-看分析 / 3-存档导出 */
const currentStage = ref(1)

/** 上传的错题图片预览URL（Blob URL） */
const imagePreview = ref('')

/** 控制报告预览弹窗的开关 */
const reportOpen = ref(false)

/** 页面全局加载状态 */
const loading = ref(false)

/** 控制手动录入弹窗的开关 */
const manualOpen = ref(false)

/** 手动录入诊断的表单数据 */
const manualForm = ref({
  studentName: '',
  className: '',
  subject: '数学',
  topic: '',
  questionText: '',
})

/** 班级热力图数据 */
const heatmapData = ref(null)

/** 控制热力图弹窗的开关 */
const heatmapOpen = ref(false)

/** 全部诊断记录（扁平列表，不分学生） */
const flatRecords = ref([])

/** 控制全部记录弹窗的开关 */
const recordsOpen = ref(false)

/** 视图模式：'students' 表示学生视图 */
const viewMode = ref('students')

// ==================== 计算属性 ====================

/**
 * 页面头部统计卡片数据
 * - 待处理样本：高风险学生数量
 * - 已生成建议：所有学生错题报告总数
 * - 档案更新：已归档的诊断记录数
 */
const derivedStats = computed(() => {
  const highRisk = students.value.filter((s) => s.level === '高风险').length
  const totalReports = students.value.reduce((sum, s) => sum + s.wrongCount, 0)
  return [
    { label: '待处理样本', value: String(highRisk) },
    { label: '已生成建议', value: String(totalReports) },
    { label: '档案更新', value: String(archiveEntries.value.length) },
  ]
})

/**
 * 根据搜索关键词过滤后的学生列表
 * - 按错题数从高到低排序
 * - 支持按学生姓名、班级、知识点、错因模糊搜索
 */
const filteredStudents = computed(() => {
  const key = keyword.value.trim()
  const source = [...students.value].sort((a, b) => b.wrongCount - a.wrongCount)
  if (!key) return source
  return source.filter((item) => `${item.name}${item.className}${item.topic}${item.reason}`.includes(key))
})

/**
 * 当前选中的学生对象
 * 优先从过滤后的列表中查找，其次从全量列表中查找，兜底取第一个学生
 */
const current = computed(() =>
  filteredStudents.value.find((item) => item.name === currentName.value)
  || students.value.find((item) => item.name === currentName.value)
  || students.value[0],
)

/** 已归档诊断记录的数量 */
const archiveCount = computed(() => archiveEntries.value.length)

/** 工作流步骤进度百分比（用于进度条展示） */
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

/**
 * 三步工作流定义
 * 用于左侧边栏导航，每一步有标题和提示文字
 */
const workflow = computed(() => [
  { id: 1, title: '选学生', hint: '先从总表里点一名学生。' },
  { id: 2, title: '看分析', hint: '查看知识点、错因、措施。' },
  { id: 3, title: '存档导出', hint: '保存到学情档案并导出。' },
])

/**
 * 工作清单项（待办列表）
 * 用于左侧边栏展示当前任务的完成状态
 */
const todoList = computed(() => [
  { id: 'a', text: '选中学生', done: !!current.value },
  { id: 'b', text: '查看错因', done: currentStage.value >= 2 },
  { id: 'c', text: '保存档案', done: archiveEntries.value.length > 0 },
])

/**
 * 生成学生的错题诊断报告文本（Markdown格式）
 * 用于导出下载或预览
 */
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

// ==================== 异步业务方法 ====================

/**
 * 加载学生诊断列表
 * 从后端获取全量学生数据，映射后按错题数降序排列
 * 如果当前没有选中学生，默认选中第一个
 */
async function loadStudents() {
  loading.value = true
  try {
    const list = await listDiagnosisStudents()
    students.value = list.map(mapStudent).sort((a, b) => b.wrongCount - a.wrongCount)
    if (students.value.length > 0 && !currentName.value) {
      currentName.value = students.value[0].name
    }
  } catch {
    // 加载失败时保持空列表，静默处理
  } finally {
    loading.value = false
  }
}

/**
 * 选择一名学生并进入分析阶段（Step 2）
 * 1. 设置当前学生姓名，切换工作流步骤到2
 * 2. 异步获取学生详细画像，更新错因、措施和知识点分布数据
 * @param {Object} item - 学生对象（来自学生列表）
 */
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
        students.value = [...students.value] // 触发响应式更新
      }
    }
  } catch {
    // 获取画像失败时使用基础学生数据
  }
}

/**
 * 切换到指定工作流步骤
 * @param {number} id - 步骤ID：1/2/3
 */
function goStage(id) {
  currentStage.value = id
}

/**
 * 上传错题图片并获取AI诊断结果
 * 1. 读取文件并生成预览URL
 * 2. 调用后端API上传图片进行分析
 * 3. 更新对应学生的错题数、错因、措施
 * 4. 重新排序并切换到分析阶段
 * @param {Event} event - 文件选择事件
 */
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
    // 上传失败时静默处理
  }
}

/**
 * 重新获取当前学生的诊断分析结果
 * 用于用户手动触发刷新（如上传新错题后）
 */
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
    // 获取失败时静默处理
  }
}

/**
 * 将当前学生的诊断结果保存到学情档案
 * 1. 从学生画像中获取最新报告
 * 2. 调用后端归档API
 * 3. 在本地归档列表中添加记录
 * 4. 切换到存档导出阶段（Step 3）
 */
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
    // 归档失败时静默处理
  }
}

/**
 * 提交手动录入的诊断表单
 * 调用后端创建诊断记录后，关闭弹窗并重新加载学生列表
 */
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
  } catch { /* 提交失败时静默处理 */ }
}

/**
 * 加载全部诊断记录（扁平列表）并打开弹窗
 */
async function loadFlatRecords() {
  try {
    flatRecords.value = await listDiagnoses()
    recordsOpen.value = true
  } catch { /* 加载失败时静默处理 */ }
}

/**
 * 加载班级热力图数据并打开弹窗
 */
async function loadHeatmapData() {
  try {
    heatmapData.value = await getHeatmap()
    heatmapOpen.value = true
  } catch { /* 加载失败时静默处理 */ }
}

// 页面初始化：加载学生列表
loadStudents()
</script>

<!-- ==================== 页面模板 ==================== -->
<template>
  <!--
    SoloAppShell：单页应用布局外壳
    - 提供顶部导航栏、左侧边栏和主内容区域的三栏布局
    - 接收页面标题、统计数据、导航菜单等配置
  -->
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems"
    :theme="theme">

    <!-- ===== 左侧边栏区域 ===== -->
    <template #left>
      <aside class="lesson-bookmark-sidebar">

        <!-- 使用顺序卡片：展示三步工作流的进度和导航 -->
        <div class="bookmark-card">
          <div class="bookmark-head">
            <ListTodo :size="16" />
            <strong>使用顺序</strong>
          </div>
          <!-- 步骤进度条 -->
          <div class="bookmark-progress">
            <UiProgress :value="navProgress" label="当前步骤" />
          </div>
          <!-- 三个步骤按钮，点击切换currentStage -->
          <button v-for="item in workflow" :key="item.id" type="button" class="bookmark-item"
            :class="{ active: currentStage === item.id }" @click="goStage(item.id)">
            <span class="bookmark-index">{{ item.id }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.hint }}</p>
            </div>
          </button>
        </div>

        <!-- 工作清单卡片：展示待办事项的完成状态 -->
        <div class="bookmark-card">
          <div class="bookmark-head">
            <CheckCircle2 :size="16" />
            <strong>工作清单</strong>
          </div>
          <!-- 每行一个待办项，done为true时显示完成样式 -->
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }">
            <span class="todo-dot"></span>
            <p>{{ todo.text }}</p>
          </article>
        </div>
      </aside>
    </template>

    <!-- ===== 右侧信息区 ===== -->
    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head">
          <strong>当前学生</strong>
          <span class="header-channel">错题诊断</span>
        </div>
        <!-- 当前学生信息摘要 -->
        <ul class="workspace-checklist">
          <li><span class="workspace-check"></span><span>{{ current?.name || '未选择' }}</span></li>
          <li><span class="workspace-check"></span><span>{{ current?.topic || '-' }}</span></li>
          <li><span class="workspace-check"></span><span>已归档 {{ archiveCount }}</span></li>
        </ul>
      </UiCard>
    </template>

    <!-- ===== 主内容区：三步工作流面板 ===== -->
    <section class="feature-screen mid-ops-board mid-diagnosis-table-board">

      <!--
        Step 1：学生选择表格
        显示所有诊断学生，支持搜索和点击选择
      -->
      <section v-if="currentStage === 1" class="editor-card mid-table-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 1</p>
            <h3>先选学生</h3>
          </div>
          <!-- 搜索输入框：按学生姓名/班级/知识点/错因模糊筛选 -->
          <input v-model="keyword" placeholder="搜索学生/班级/知识点" />
        </div>

        <!-- 加载状态提示 -->
        <p v-if="loading" class="helper-copy">加载中…</p>

        <!-- 学生数据表格 -->
        <div v-else class="mid-student-table-wrap">
          <table class="mid-student-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>学生</th>
                <th>班级</th>
                <th>知识点</th>
                <th>错题数</th>
                <th>等级</th>
                <th>更新</th>
              </tr>
            </thead>
            <tbody>
              <!-- 遍历过滤后的学生列表，点击行选择学生 -->
              <tr v-for="(item, index) in filteredStudents" :key="item.name"
                :class="{ active: currentName === item.name }" @click="selectStudent(item)">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.className }}</td>
                <td>{{ item.topic }}</td>
                <!-- 错题数徽章：颜色由风险等级决定 -->
                <td>
                  <span class="wrong-count-pill" :style="{ background: item.color }">
                    {{ item.wrongCount }}
                  </span>
                </td>
                <!-- 风险等级：文字颜色由等级决定 -->
                <td :style="{ color: item.color, fontWeight: 700 }">{{ item.level }}</td>
                <td>{{ item.latestDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空数据提示 -->
        <p v-if="!loading && !students.length" class="helper-copy">
          暂无诊断数据，请先上传错题。
        </p>

        <!-- 底部操作栏 -->
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="manualOpen = true">手动录入</UiButton>
          <UiButton variant="secondary" @click="loadFlatRecords">全部记录</UiButton>
          <UiButton variant="secondary" @click="loadHeatmapData">热力图</UiButton>
        </div>
      </section>

      <!--
        Step 2：学生分析详情
        展示知识点分布、错因文本、改进措施，支持上传错题和重新分析
      -->
      <section v-if="currentStage === 2" class="editor-card student-profile-card mid-analysis-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 2</p>
            <h3>{{ current?.name || '' }}</h3>
          </div>
        </div>

        <!-- 错题图片预览（上传后显示） -->
        <img v-if="imagePreview" :src="imagePreview" alt="错题样本" class="analysis-preview-image" />

        <!-- 知识点分布条形图 -->
        <div v-if="current?.knowledge?.length" class="knowledge-bars">
          <article v-for="item in current.knowledge" :key="item.name" class="knowledge-bar-item">
            <div>
              <strong>{{ item.name }}</strong>
              <small>{{ item.value }}%</small>
            </div>
            <!-- 知识点掌握程度进度条 -->
            <div class="knowledge-track">
              <span :style="{ width: `${item.value}%` }"></span>
            </div>
          </article>
        </div>

        <!-- 错因分析文本域（教师可编辑） -->
        <textarea v-model="current.reason" rows="4"></textarea>

        <!-- 改进措施文本域（教师可编辑） -->
        <textarea v-model="current.strategy" rows="4"></textarea>

        <!-- 底部操作栏 -->
        <div class="bottom-action-bar">
          <!-- 上传错题图片（隐藏原生file input，用label美化） -->
          <label class="ui-btn ui-btn-secondary mid-upload-btn">
            <input type="file" accept="image/*" class="hidden-file" @change="uploadSample" />
            <Camera :size="16" />
            上传新错题
          </label>
          <UiButton variant="secondary" @click="rerunRecognition">
            <RefreshCcw :size="16" />
            重新分析
          </UiButton>
          <UiButton @click="saveStudent">
            <Save :size="16" />
            下一步
          </UiButton>
        </div>
      </section>

      <!--
        Step 3：存档与导出
        展示已归档的诊断记录，支持预览和导出报告
      -->
      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">STEP 3</p>
            <h3>存档与导出</h3>
          </div>
          <!-- 导出诊断单为txt文件下载 -->
          <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(reportSummary)}`"
            download="学生错题诊断单.txt">
            <FileText :size="16" />
            导出给学生
          </UiButton>
        </div>

        <!-- 归档记录列表 -->
        <div class="card-list">
          <article v-for="item in archiveEntries" :key="item.id" class="data-card">
            <strong>{{ item.time }}</strong>
            <p>{{ item.text }}</p>
          </article>
          <!-- 空记录提示 -->
          <article v-if="!archiveEntries.length" class="data-card">
            <strong>暂无记录</strong>
          </article>
        </div>

        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="reportOpen = true">预览导出</UiButton>
        </div>
      </section>

      <!-- ===== 弹窗区域 ===== -->

      <!-- 导出预览弹窗：以等宽字体显示报告全文 -->
      <UiDialog v-model:open="reportOpen" title="导出预览" description="">
        <div class="preview-paper">
          <pre>{{ reportSummary }}</pre>
        </div>
      </UiDialog>

      <!-- 手动录入诊断弹窗：表单包含学生姓名、班级、学科、知识点、题目描述 -->
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

      <!-- 全部诊断记录弹窗：展示最近20条记录 -->
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

      <!-- 班级热力图弹窗：展示整体统计和各知识点分布 -->
      <UiDialog v-model:open="heatmapOpen" title="班级热力图" description="">
        <div v-if="heatmapData">
          <p><strong>班级：</strong>{{ heatmapData.className || '全部' }}</p>
          <p><strong>总报告数：</strong>{{ heatmapData.totalReports }}</p>
          <p><strong>高风险学生：</strong>{{ heatmapData.highRiskStudents }}</p>
          <!-- 知识点热力分布列表 -->
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
