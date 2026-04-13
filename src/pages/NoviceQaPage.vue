<script setup>
import { computed, ref } from 'vue'
import { CheckCircle2, Image as ImageIcon, ListTodo, Send, UserRoundPlus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { noviceApp } from '../mock/platformData'

const draft = ref(noviceApp.qa.draft)
const records = ref(noviceApp.qa.records.map((item, index) => ({
  ...item,
  likes: [18, 11, 7][index] || 5,
  time: ['今天 14:20', '今天 11:05', '昨天 19:42'][index] || '今天 09:10',
  topic: ['课堂表达', '提问设计', '活动组织'][index] || '课堂表达',
  comments: [
    { id: `${item.id}-1`, from: '周海燕', text: '先给句式模板。' },
    { id: `${item.id}-2`, from: '平台助理', text: '可以拆成三步表达。' },
  ],
})))
const mentorOpen = ref(false)
const currentStage = ref(1)

const workflow = computed(() => [
  { id: 1, title: '发动态', hint: '先写课堂问题。' },
  { id: 2, title: '看回复', hint: '看社区答疑。' },
  { id: 3, title: '转给名师', hint: '需要时再发给专家。' },
])
const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))
const todoList = computed(() => [
  { id: '1', text: '写下问题', done: !!draft.value.trim() },
  { id: '2', text: '发布动态', done: records.value.some((item) => item.from === '我') },
  { id: '3', text: '查看回复', done: currentStage.value >= 2 },
])

function submitQuestion() {
  if (!draft.value.trim()) return
  records.value.unshift({
    id: Date.now(),
    from: '我',
    role: '待回复',
    text: draft.value,
    likes: 0,
    time: '刚刚',
    topic: '课堂表达',
    comments: [{ id: `${Date.now()}-c1`, from: '平台助理', text: '已收到。' }],
  })
  draft.value = ''
  currentStage.value = 2
}
function forwardToMentor() { mentorOpen.value = true; currentStage.value = 3 }
function goStage(id) { currentStage.value = id }
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.qa.title" subtitle="" :stats="noviceApp.qa.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
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
        <div class="workspace-panel-head"><strong>社区记录</strong><span class="header-channel">{{ records.length }} 条</span></div>
        <ul class="workspace-checklist"><li><span class="workspace-check"></span><span>先发动态，再看回复</span></li></ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-community-feed">
      <section v-if="currentStage === 1" class="editor-card community-compose-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>发动态</h3></div></div>
        <div class="community-compose-actions">
          <button class="community-inline-action"><ImageIcon :size="16" /> 配图</button>
          <button class="community-inline-action" @click="forwardToMentor"><UserRoundPlus :size="16" /> @名师</button>
        </div>
        <textarea v-model="draft" rows="5"></textarea>
        <div class="bottom-action-bar"><UiButton @click="submitQuestion"><Send :size="16" /> 发布</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>看回复</h3></div></div>
        <div class="community-post-list">
          <article v-for="item in records" :key="item.id" class="community-post-card">
            <div class="community-post-head"><div class="community-avatar alt">{{ item.from.slice(0, 1) }}</div><div class="community-post-meta"><strong>{{ item.from }}</strong><small>{{ item.time }} · {{ item.role }}</small></div></div>
            <div class="community-post-copy"><span class="community-topic-tag"># {{ item.topic }}</span><p>{{ item.text }}</p></div>
            <div class="community-comment-box"><article v-for="reply in item.comments" :key="reply.id" class="community-comment-item"><strong>{{ reply.from }}</strong><p>{{ reply.text }}</p></article></div>
          </article>
        </div>
        <div class="bottom-action-bar"><UiButton variant="secondary" @click="forwardToMentor"><UserRoundPlus :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>转给名师</h3></div></div>
        <div class="bottom-action-bar"><UiButton @click="mentorOpen = true"><UserRoundPlus :size="16" /> 打开预览</UiButton></div>
      </section>

      <UiDialog v-model:open="mentorOpen" title="名师转发预览" description="">
        <div class="preview-paper"><p><strong>待转发：</strong>{{ draft || '当前输入框为空' }}</p></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
