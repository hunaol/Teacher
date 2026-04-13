<script setup>
import { computed, ref } from 'vue'
import { CalendarRange, Download, Eye, ListTodo, Plus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { noviceApp } from '../mock/platformData'

const levelColors = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月']
const items = ref(noviceApp.portfolio.items.map((item, index) => ({ id: index + 1, text: item, date: `2026-04-${String(index + 3).padStart(2, '0')}`, count: (index % 4) + 1 })))
const previewOpen = ref(false)
const draft = ref('')
const selectedMonth = ref(3)
const currentStage = ref(1)

const workflow = computed(() => [
  { id: 1, title: '看热力图', hint: '先看本月分布。' },
  { id: 2, title: '写记录', hint: '补一条成长记录。' },
  { id: 3, title: '导出成就墙', hint: '最后导出。' },
])
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))
const todoList = computed(() => [
  { id: '1', text: '查看热力图', done: true },
  { id: '2', text: '新增记录', done: items.value.some((item) => item.id > 1000) },
  { id: '3', text: '导出成就墙', done: false },
])

const calendarCells = computed(() => Array.from({ length: 35 }, (_, index) => {
  const day = index + 1
  const matched = items.value.find((item) => Number(item.date.slice(-2)) === day)
  const count = matched?.count || ((day % 9 === 0) ? 4 : (day % 6 === 0 ? 3 : (day % 4 === 0 ? 2 : (day % 3 === 0 ? 1 : 0))))
  return { key: `day-${day}`, day, count, color: levelColors[Math.min(count, 4)] }
}))
const yearCalendar = computed(() => monthLabels.map((label, monthIndex) => ({ label, blocks: Array.from({ length: 28 }, (_, blockIndex) => ({ key: `${label}-${blockIndex}`, color: levelColors[(monthIndex + blockIndex) % 5] })) })))
const achievementWall = computed(() => ['# 新任教师成长成就墙','',`- 累计成长条目：${items.value.length}`,'','## 本月记录',...items.value.map((item, index) => `${index + 1}. ${item.date}｜${item.text}`)].join('\n'))

function addItem() {
  if (!draft.value.trim()) return
  items.value.unshift({ id: Date.now(), text: draft.value, date: `2026-${String(selectedMonth + 1).padStart(2, '0')}-${String((items.value.length % 28) + 1).padStart(2, '0')}`, count: 4 })
  draft.value = ''
  currentStage.value = 3
}
function goStage(id) { currentStage.value = id }
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.portfolio.title" subtitle="" :stats="noviceApp.portfolio.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
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
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>档案</strong><span class="header-channel">{{ items.length }} 条</span></div>
        <ul class="workspace-checklist"><li v-for="todo in todoList" :key="todo.id"><span class="workspace-check"></span><span>{{ todo.text }}</span></li></ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-portfolio-calendar-board">
      <section v-if="currentStage === 1" class="editor-card portfolio-calendar-main">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>{{ monthLabels[selectedMonth] }} 热力图</h3></div></div>
        <div class="portfolio-week-head"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <div class="portfolio-calendar-grid"><article v-for="cell in calendarCells" :key="cell.key" class="portfolio-calendar-cell" :style="{ background: cell.color }"><strong>{{ cell.day }}</strong><small>{{ cell.count }} 条</small></article></div>
        <div class="bottom-action-bar"><UiButton @click="currentStage = 2"><Plus :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>新增记录</h3></div></div>
        <textarea v-model="draft" rows="4"></textarea>
        <div class="bottom-action-bar"><UiButton @click="addItem"><Plus :size="16" /> 保存</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card portfolio-year-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>导出成就墙</h3></div><span class="status-pill"><CalendarRange :size="14" /> 年历</span></div>
        <div class="portfolio-year-list"><article v-for="month in yearCalendar" :key="month.label" class="portfolio-year-row"><strong>{{ month.label }}</strong><div class="portfolio-year-blocks"><span v-for="block in month.blocks" :key="block.key" :style="{ background: block.color }"></span></div></article></div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="previewOpen = true"><Eye :size="16" /> 预览</UiButton>
          <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(achievementWall)}`" download="成长成就墙.txt"><Download :size="16" /> 导出</UiButton>
        </div>
      </section>

      <UiDialog v-model:open="previewOpen" title="成长成就墙预览" description="">
        <div class="preview-paper"><pre>{{ achievementWall }}</pre></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
