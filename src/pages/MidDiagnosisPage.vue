<script setup>
import { computed, ref } from 'vue'
import { ChartNoAxesColumn, ImagePlus, RefreshCcw, Save, Sparkles, Upload } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { midApp } from '../mock/platformData'

const students = ref(midApp.diagnosis.students.map((item) => ({ ...item })))
const current = ref({ ...students.value[0] })
const imageName = ref('错题样本-001.jpg')
const imagePreview = ref('https://picsum.photos/seed/error-sheet/800/520')
const reportOpen = ref(false)
const analyzeProgress = ref(22)

const sampleCount = computed(() => students.value.length)

function selectStudent(item) {
  current.value = { ...item }
}

function saveStudent() {
  const index = students.value.findIndex((item) => item.id === current.value.id)
  if (index >= 0) students.value[index] = { ...current.value, status: '已保存至学情档案' }
}

function uploadSample(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imageName.value = file.name
  imagePreview.value = URL.createObjectURL(file)
  analyzeProgress.value = 35
}

function rerunRecognition() {
  analyzeProgress.value = 48
  window.setTimeout(() => {
    current.value.reason = `${current.value.reason} 已根据最新样本补充识别结果。`
    current.value.strategy = `${current.value.strategy} 建议追加 1 次针对性跟踪练习。`
    analyzeProgress.value = 100
  }, 600)
}
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.diagnosis.title" :subtitle="midApp.diagnosis.subtitle" :stats="midApp.diagnosis.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
    <section class="feature-screen mid-ops-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">诊断中心</p>
          <h3>{{ imageName }} · 错因识别与改进建议</h3>
        </div>
        <span class="status-pill"><ChartNoAxesColumn :size="14" /> 学情分析面板</span>
      </div>

      <div class="visual-card mid-insight-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">诊断概览</p>
            <h3>把样本、错因和策略拉到同一张操作台里</h3>
          </div>
          <span class="status-pill"><Sparkles :size="14" /> 图像识别中枢</span>
        </div>
        <div class="student-signal-list">
          <div class="student-signal">
            <span>待判读样本</span>
            <strong>{{ sampleCount }}</strong>
            <p>支持上传本地作答截图进行前端演示。</p>
          </div>
          <div class="student-signal">
            <span>高频错因</span>
            <strong>单位 1</strong>
            <p>本周数学题中重复出现最多。</p>
          </div>
          <div class="student-signal">
            <span>建议动作</span>
            <strong>分层追踪</strong>
            <p>可直接同步进后续干预记录。</p>
          </div>
        </div>
      </div>

      <div class="mid-diagnosis-grid">
        <div class="card-list mid-student-list">
          <label class="upload-tile data-card clickable-card">
            <input type="file" accept="image/*" class="hidden-file" @change="uploadSample" />
            <ImagePlus :size="18" />
            <strong>上传新样本</strong>
            <p>支持图片上传与前端预览</p>
          </label>
          <article v-for="item in students" :key="item.id" class="data-card clickable-card" :class="{ active: current.id === item.id }" @click="selectStudent(item)">
            <strong>{{ item.name }}</strong>
            <p>{{ item.subject }}</p>
            <small>{{ item.status }}</small>
          </article>
        </div>

        <div class="editor-card mid-analysis-card student-profile-card">
          <div class="student-profile-top">
            <div class="student-avatar"><ChartNoAxesColumn :size="18" /></div>
            <div>
              <strong>{{ current.name }}</strong>
              <p>{{ imageName }}</p>
            </div>
          </div>
          <img :src="imagePreview" alt="错题样本" class="analysis-preview-image" />
          <UiProgress :value="analyzeProgress" label="识别进度" />
          <input v-model="current.subject" placeholder="错题主题" />
          <textarea v-model="current.reason" rows="5" placeholder="系统错因分析"></textarea>
          <textarea v-model="current.strategy" rows="5" placeholder="针对性改进策略"></textarea>
          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="rerunRecognition"><RefreshCcw :size="16" /> 重新识别</UiButton>
            <UiButton variant="secondary" @click="reportOpen = true"><Upload :size="16" /> 查看报告</UiButton>
            <UiButton @click="saveStudent"><Save :size="16" /> 保存档案</UiButton>
          </div>
        </div>
      </div>

      <UiDialog v-model:open="reportOpen" title="诊断报告预览" description="前端模拟错因分析报告。">
        <div class="preview-paper">
          <h2>{{ current.name }} · 诊断简报</h2>
          <p><strong>主题：</strong>{{ current.subject }}</p>
          <p><strong>错因：</strong>{{ current.reason }}</p>
          <p><strong>建议：</strong>{{ current.strategy }}</p>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
