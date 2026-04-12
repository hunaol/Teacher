<script setup>
import { computed, ref } from 'vue'
import { Download, Eye, FolderKanban, NotebookTabs } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import { noviceApp } from '../mock/platformData'

const items = ref(noviceApp.portfolio.items.map((item, index) => ({ id: index + 1, text: item })))
const previewOpen = ref(false)

const exportText = computed(() => items.value.map((item) => `${item.id}. ${item.text}`).join('\n'))
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.portfolio.title" :subtitle="noviceApp.portfolio.subtitle" :stats="noviceApp.portfolio.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
    <section class="feature-screen novice-learning-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">成长记录</p>
          <h3>{{ items.length }} 项成长档案内容</h3>
        </div>
        <span class="status-pill"><FolderKanban :size="14" /> 自动汇总阶段进步</span>
      </div>

      <div class="novice-portfolio-hero visual-card">
        <strong>本阶段成长概览</strong>
        <p>系统已根据你的课堂实践、答疑记录和反馈建议整理出成长档案，方便回顾与导出。</p>
        <div class="portfolio-tag-list">
          <span>课堂方法</span>
          <span>学生反馈</span>
          <span>名师点评</span>
          <span>阶段目标</span>
        </div>
      </div>

      <div class="novice-portfolio-list card-list">
        <article v-for="item in items" :key="item.id" class="data-card novice-portfolio-item">
          <div class="portfolio-index"><NotebookTabs :size="18" /></div>
          <div>
            <strong>成长条目 {{ item.id }}</strong>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </div>

      <div class="bottom-action-bar">
        <UiButton variant="secondary" @click="previewOpen = true"><Eye :size="16" /> 预览档案</UiButton>
        <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(exportText)}`" download="成长档案.txt">
          <Download :size="16" /> 导出 TXT
        </UiButton>
      </div>

      <UiDialog v-model:open="previewOpen" title="成长档案预览" description="纯前端生成的个人成长档案。">
        <div class="preview-paper">
          <pre>{{ exportText }}</pre>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
