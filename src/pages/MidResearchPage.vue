<script setup>
import { computed, ref } from 'vue'
import { BookPlus, FileBadge2, Send, Telescope } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import { midApp } from '../mock/platformData'

const topics = ref(midApp.research.list.map((item) => ({ ...item })))
const selected = ref({ ...topics.value[0] })
const expertOpen = ref(false)

const topicSummary = computed(() => `${selected.value.title}\n\n${selected.value.meta}\n\n${selected.value.extra}`)

function selectTopic(item) {
  selected.value = { ...item }
}

function saveTopic() {
  const index = topics.value.findIndex((item) => item.id === selected.value.id)
  if (index >= 0) topics.value[index] = { ...selected.value }
}
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.research.title" :subtitle="midApp.research.subtitle" :stats="midApp.research.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
    <section class="feature-screen mid-ops-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">研究导航</p>
          <h3>推荐依据、申报模板与专家资源一体查看</h3>
        </div>
        <span class="status-pill"><Telescope :size="14" /> 课题孵化板</span>
      </div>

      <div class="visual-card research-brief-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">选题简报</p>
            <h3>从课堂问题直接过渡到课题方向</h3>
          </div>
          <span class="status-pill"><BookPlus :size="14" /> 证据驱动</span>
        </div>
        <div class="research-brief-grid">
          <div class="research-brief-item">
            <span>推荐频次</span>
            <strong>2 次</strong>
            <p>本周已有两个方向进入优先列表。</p>
          </div>
          <div class="research-brief-item">
            <span>最强依据</span>
            <strong>课堂互动</strong>
            <p>学生表达时长在持续上升。</p>
          </div>
          <div class="research-brief-item">
            <span>下一步</span>
            <strong>创建课题</strong>
            <p>选题后可继续补申报模板与专家资源。</p>
          </div>
        </div>
      </div>

      <div class="mid-research-board">
        <div class="card-list mid-topic-list">
          <article v-for="item in topics" :key="item.id" class="data-card clickable-card research-topic-card" :class="{ active: selected.id === item.id }" @click="selectTopic(item)">
            <strong>{{ item.title }}</strong>
            <p>{{ item.meta }}</p>
          </article>
        </div>

        <div class="editor-card mid-topic-detail">
          <label class="screen-label">研究选题</label>
          <input v-model="selected.title" placeholder="研究选题" />
          <label class="screen-label">推荐依据</label>
          <textarea v-model="selected.meta" rows="4" placeholder="系统推荐依据"></textarea>
          <label class="screen-label">模板与专家资源</label>
          <textarea v-model="selected.extra" rows="5" placeholder="申报模板与专家资源"></textarea>
          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="expertOpen = true"><Send :size="16" /> 咨询专家</UiButton>
            <UiButton @click="saveTopic"><FileBadge2 :size="16" /> 创建课题</UiButton>
          </div>
        </div>
      </div>

      <UiDialog v-model:open="expertOpen" title="专家咨询草稿" description="纯前端模拟向专家发送的课题摘要。">
        <div class="preview-paper">
          <pre>{{ topicSummary }}</pre>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
