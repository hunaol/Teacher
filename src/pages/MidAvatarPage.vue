<script setup>
import { computed, ref } from 'vue'
import { Bot, MessagesSquare, Play, Sparkles, Volume2 } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiTabs from '../components/ui/UiTabs.vue'
import { midApp } from '../mock/platformData'

const mode = ref(midApp.avatar.modes[0])
const scene = ref('课堂导入')
const scriptOpen = ref(false)
const scriptTab = ref('script')

const tabs = [
  { label: '讲解脚本', value: 'script' },
  { label: '互动提示', value: 'tips' },
]

const generatedScript = computed(() => `【${scene.value}】\n当前风格：${mode.value.name}\n\n开场：同学们，先观察这个问题里的关键信息。\n推进：谁愿意先试着说说自己的理解？\n反馈：很好，我们再把刚才的想法整理得更完整一些。`)
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.avatar.title" :subtitle="midApp.avatar.subtitle" :stats="midApp.avatar.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
    <section class="feature-screen mid-ops-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">互动控制台</p>
          <h3>{{ scene }} · {{ mode.name }}</h3>
        </div>
        <span class="status-pill"><Bot :size="14" /> 数字人课堂辅助</span>
      </div>

      <div class="mid-avatar-stage">
        <div class="visual-card avatar-stage-card">
          <div class="avatar-stage-head">
            <div>
              <p class="hero-kicker">数字人舞台</p>
              <h3>围绕当前课堂场景输出互动脚本</h3>
            </div>
            <span class="status-pill"><MessagesSquare :size="14" /> {{ scene }}</span>
          </div>
          <div class="avatar-orbit">
            <span class="avatar-signal s1">追问提示</span>
            <span class="avatar-signal s2">鼓励反馈</span>
            <span class="avatar-signal s3">节奏控制</span>
            <div class="avatar-core">AI</div>
          </div>
          <strong>{{ mode.name }}</strong>
          <p>{{ mode.text }}</p>
        </div>

        <div class="editor-card avatar-control-card">
          <label class="screen-label">课堂场景</label>
          <div class="choice-bar">
            <button class="choice-btn" @click="scene = '课堂导入'">课堂导入</button>
            <button class="choice-btn" @click="scene = '互动提问'">互动提问</button>
            <button class="choice-btn" @click="scene = '习题讲评'">习题讲评</button>
          </div>
          <label class="screen-label">讲解风格</label>
          <div class="card-list">
            <button v-for="item in midApp.avatar.modes" :key="item.id" class="choice-btn avatar-mode-btn" :class="{ active: mode.id === item.id }" @click="mode = item">
              <Sparkles :size="16" /> {{ item.name }}
            </button>
          </div>
          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="scriptOpen = true"><Volume2 :size="16" /> 切换脚本</UiButton>
            <UiButton @click="scriptOpen = true"><Play :size="16" /> 开始互动</UiButton>
          </div>
        </div>
      </div>

      <UiDialog v-model:open="scriptOpen" title="数字人互动脚本" description="基于当前课堂场景和风格的前端脚本预览。">
        <UiTabs v-model="scriptTab" :items="tabs" />
        <div v-if="scriptTab === 'script'" class="preview-paper">
          <pre>{{ generatedScript }}</pre>
        </div>
        <div v-else class="preview-paper">
          <ul>
            <li>每 20 秒抛出一次短追问，保持学生开口率。</li>
            <li>学生回答后先肯定，再补充更完整表达。</li>
            <li>当课堂冷场时，先给示例句式再让学生模仿。</li>
          </ul>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
