<script setup>
import { computed, ref } from 'vue'
import { Camera, CheckCircle2, FileText, ListTodo, RefreshCcw, Save } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import { midApp } from '../mock/platformData'

const names = ['王晨','李萌','陈果','周宁','赵川','何雨','孙璐','郑航','吴桐','冯乐','蒋欣','陶可','陆凡','马悦','谢安','邱晨','许诺','曹睿','潘琪','朱琳','韩涛','沈佳','梁宇','丁然','罗茜','袁博','魏星','唐菲','苏航','顾言']
const topics = ['分数应用题', '阅读理解', '实验记录', '几何证明', '病句修改', '函数图像']

function buildStudents() {
  return Array.from({ length: 30 }, (_, index) => {
    const wrongCount = 12 - (index % 10) - Math.floor(index / 8)
    return {
      id: index + 1,
      name: names[index],
      className: `六年级${(index % 5) + 1}班`,
      topic: topics[index % topics.length],
      wrongCount,
      latestDate: `04-${String((index % 20) + 1).padStart(2, '0')}`,
      level: wrongCount >= 8 ? '高风险' : wrongCount >= 5 ? '需关注' : '稳定',
      color: wrongCount >= 8 ? '#ef4444' : wrongCount >= 5 ? '#f59e0b' : '#22c55e',
      reason: wrongCount >= 8 ? '审题不稳，数量关系提取反复出错。' : wrongCount >= 5 ? '迁移应用时步骤容易混淆。' : '少量变式题仍需回看。',
      strategy: wrongCount >= 8 ? '先个别纠偏，再做同构题和变式题。' : wrongCount >= 5 ? '补充审题口令训练与讲评。' : '保持每周一次错题回顾。',
      archive: [],
      knowledge: [
        { name: '基础概念', value: Math.max(10, 42 - index) },
        { name: '审题判断', value: Math.max(10, 26 + (index % 5) * 8) },
        { name: '迁移应用', value: Math.max(10, 20 + (index % 7) * 6) },
      ],
    }
  }).sort((a, b) => b.wrongCount - a.wrongCount)
}

const students = ref(buildStudents())
const keyword = ref('')
const currentId = ref(students.value[0].id)
const currentStage = ref(1)
const imagePreview = ref('https://picsum.photos/seed/error-sheet/800/520')
const reportOpen = ref(false)

const filteredStudents = computed(() => {
  const key = keyword.value.trim()
  const source = [...students.value].sort((a, b) => b.wrongCount - a.wrongCount)
  if (!key) return source
  return source.filter((item) => `${item.name}${item.className}${item.topic}${item.reason}`.includes(key))
})
const current = computed(() => filteredStudents.value.find((item) => item.id === currentId.value) || students.value.find((item) => item.id === currentId.value) || students.value[0])
const archiveCount = computed(() => students.value.reduce((sum, item) => sum + item.archive.length, 0))
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))
const workflow = computed(() => [
  { id: 1, title: '选学生', hint: '先从总表里点一名学生。' },
  { id: 2, title: '看分析', hint: '查看知识点、错因、措施。' },
  { id: 3, title: '存档导出', hint: '保存到学情档案并导出。' },
])
const todoList = computed(() => [
  { id: 'a', text: '选中学生', done: !!current.value },
  { id: 'b', text: '查看错因', done: currentStage.value >= 2 },
  { id: 'c', text: '保存档案', done: !!current.value.archive.length },
])
const reportSummary = computed(() => `# ${current.value.name} 错题诊断单\n\n- 班级：${current.value.className}\n- 错题数：${current.value.wrongCount}\n- 知识点：${current.value.topic}\n\n## 错因\n${current.value.reason}\n\n## 改进措施\n${current.value.strategy}`)

function selectStudent(item) {
  currentId.value = item.id
  currentStage.value = 2
}
function goStage(id) {
  currentStage.value = id
}
function uploadSample(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imagePreview.value = URL.createObjectURL(file)
  current.value.wrongCount += 1
  current.value.reason = `${current.value.reason} 新样本显示同类问题仍在重复。`
  current.value.strategy = `${current.value.strategy} 本周再补 1 次针对训练。`
  students.value = [...students.value].sort((a, b) => b.wrongCount - a.wrongCount)
  currentStage.value = 2
}
function rerunRecognition() {
  current.value.reason = `${current.value.reason} 系统复核后确认主要失分来自审题与迁移。`
  current.value.strategy = `${current.value.strategy} 可配套学生自查单。`
}
function saveStudent() {
  current.value.archive.unshift({
    id: Date.now(),
    time: `今天 ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    text: `${current.value.topic}｜${current.value.strategy}`,
  })
  currentStage.value = 3
}
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.diagnosis.title" subtitle="" :stats="midApp.diagnosis.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
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
          <li><span class="workspace-check"></span><span>{{ current.name }}</span></li>
          <li><span class="workspace-check"></span><span>{{ current.topic }}</span></li>
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
        <div class="mid-student-table-wrap">
          <table class="mid-student-table">
            <thead><tr><th>排名</th><th>学生</th><th>班级</th><th>知识点</th><th>错题数</th><th>等级</th><th>更新</th></tr></thead>
            <tbody>
              <tr v-for="(item, index) in filteredStudents" :key="item.id" :class="{ active: currentId === item.id }" @click="selectStudent(item)">
                <td>{{ index + 1 }}</td><td>{{ item.name }}</td><td>{{ item.className }}</td><td>{{ item.topic }}</td>
                <td><span class="wrong-count-pill" :style="{ background: item.color }">{{ item.wrongCount }}</span></td>
                <td :style="{ color: item.color, fontWeight: 700 }">{{ item.level }}</td><td>{{ item.latestDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="currentStage === 2" class="editor-card student-profile-card mid-analysis-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>{{ current.name }}</h3></div></div>
        <img :src="imagePreview" alt="错题样本" class="analysis-preview-image" />
        <div class="knowledge-bars">
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
          <article v-for="item in current.archive" :key="item.id" class="data-card"><strong>{{ item.time }}</strong><p>{{ item.text }}</p></article>
          <article v-if="!current.archive.length" class="data-card"><strong>暂无记录</strong></article>
        </div>
        <div class="bottom-action-bar"><UiButton variant="secondary" @click="reportOpen = true">预览导出</UiButton></div>
      </section>

      <UiDialog v-model:open="reportOpen" title="导出预览" description="">
        <div class="preview-paper"><pre>{{ reportSummary }}</pre></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
