<script setup>
import { computed, ref } from 'vue'
import { BadgeHelp, MessageCircleReply, Send, Sparkles, UserRoundPlus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import { noviceApp } from '../mock/platformData'

const draft = ref(noviceApp.qa.draft)
const records = ref(noviceApp.qa.records.map((item) => ({ ...item })))
const mentorOpen = ref(false)

const recordCount = computed(() => records.value.length)

function submitQuestion() {
  if (!draft.value.trim()) return
  records.value.unshift({ id: Date.now(), from: '我', role: '待回复', text: draft.value })
  draft.value = ''
}

function forwardToMentor() {
  mentorOpen.value = true
}
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.qa.title" :subtitle="noviceApp.qa.subtitle" :stats="noviceApp.qa.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
    <section class="feature-screen novice-learning-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">课堂求助</p>
          <h3>{{ recordCount }} 条答疑互动记录</h3>
        </div>
        <span class="status-pill"><BadgeHelp :size="14" /> 提问后持续跟踪</span>
      </div>

      <div class="novice-qa-layout">
        <div class="editor-card novice-question-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">发起提问</p>
              <h3>像发帖一样把课堂困惑抛出来</h3>
            </div>
          </div>
          <div class="question-tags">
            <span>课堂表达</span>
            <span>低年级</span>
            <span>互动设计</span>
          </div>
          <textarea v-model="draft" rows="8"></textarea>
          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="forwardToMentor"><UserRoundPlus :size="16" /> 转给名师</UiButton>
            <UiButton @click="submitQuestion"><Send :size="16" /> 提交问题</UiButton>
          </div>
        </div>

        <div class="card-list answer-timeline">
          <article v-for="item in records" :key="item.id" class="data-card novice-answer-card">
            <div class="timeline-dot"><MessageCircleReply :size="16" /></div>
            <strong>{{ item.from }}</strong>
            <p>{{ item.text }}</p>
            <small class="timeline-role"><Sparkles :size="12" /> {{ item.role }}</small>
          </article>
        </div>
      </div>

      <UiDialog v-model:open="mentorOpen" title="名师转发预览" description="纯前端模拟把问题转给名师顾问。">
        <div class="preview-paper">
          <p><strong>待转发问题：</strong>{{ draft || '当前输入框为空' }}</p>
          <p><strong>目标：</strong>周海燕 · 教研顾问</p>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
