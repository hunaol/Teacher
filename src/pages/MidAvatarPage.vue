<script setup>
import { computed, ref } from 'vue'
import { Bot, Copy, MessagesSquare, Play, Sparkles, Volume2, WandSparkles } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiTabs from '../components/ui/UiTabs.vue'
import { midApp } from '../mock/platformData'

const mode = ref(midApp.avatar.modes[0])
const scene = ref('课堂导入')
const scriptOpen = ref(false)
const scriptTab = ref('script')
const runtimeStatus = ref('待启动')
const copied = ref(false)
const studentQuestion = ref('为什么这里要先确定单位 1？')
const replyDraft = ref('')
const interactionLog = ref([])

const tabs = [
  { label: '讲解脚本', value: 'script' },
  { label: '互动提示', value: 'tips' },
]

const generatedScript = computed(() => `【${scene.value}】\n当前风格：${mode.value.name}\n\n教师开场：同学们，先观察题目中的关键条件。\n数字人追问：谁能先说出“比较对象”和“单位 1”？\n数字人讲解：如果单位 1 找错了，后面的列式就会全部偏掉。\n数字人收束：现在请大家用自己的话复述一遍正确思路。`)

const interactionTips = computed(() => [
  '数字人先抛短问题，再给提示，不直接报答案。',
  `当前模式“${mode.value.name}”会影响讲解语气和追问深度。`,
  '当学生沉默时，先给句式模板，再要求学生复述。',
])

const aiReply = computed(() => {
  if (!studentQuestion.value.trim()) return '请先输入学生问题。'
  return `【${mode.value.name}】针对“${studentQuestion.value}”的回应：先让学生指出题目中的比较对象，再用线段图辅助说明“单位 1”的判断依据，最后通过一题同构练习完成巩固。`
})

function openScriptDialog(targetTab = 'script') {
  scriptTab.value = targetTab
  scriptOpen.value = true
}

function startInteraction() {
  runtimeStatus.value = `运行中 · ${scene.value}`
  interactionLog.value.unshift(`已启动数字人：${mode.value.name} · ${scene.value}`)
  scriptOpen.value = true
}

async function copyScript() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  await navigator.clipboard.writeText(generatedScript.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1200)
}

function generateReply() {
  replyDraft.value = aiReply.value
  interactionLog.value.unshift(`已生成针对学生问题的回应：${studentQuestion.value}`)
}
</script>

<template>
  <SoloAppShell :app-name="midApp.appName" :title="midApp.avatar.title" :subtitle="midApp.avatar.subtitle" :stats="midApp.avatar.stats" :nav-items="midApp.navItems" :theme="midApp.theme">
    <section class="feature-screen mid-ops-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">智能数字人</p>
          <h3>{{ scene }} · {{ mode.name }} · 课堂互动助手</h3>
        </div>
        <span class="status-pill"><Bot :size="14" /> {{ runtimeStatus }}</span>
      </div>

      <div class="mid-avatar-stage">
        <div class="visual-card avatar-stage-card">
          <div class="avatar-stage-head">
            <div>
              <p class="hero-kicker">数字人舞台</p>
              <h3>选择教学风格后直接用于课堂讲解互动</h3>
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
          <div class="feature-pills single-column-pills">
            <span>场景：{{ scene }}</span>
            <span>状态：{{ runtimeStatus }}</span>
          </div>
        </div>

        <div class="editor-card avatar-control-card">
          <label class="screen-label">课堂场景</label>
          <div class="choice-bar">
            <button class="choice-btn" :class="{ active: scene === '课堂导入' }" @click="scene = '课堂导入'">课堂导入</button>
            <button class="choice-btn" :class="{ active: scene === '互动提问' }" @click="scene = '互动提问'">互动提问</button>
            <button class="choice-btn" :class="{ active: scene === '习题讲评' }" @click="scene = '习题讲评'">习题讲评</button>
          </div>
          <label class="screen-label">教学风格</label>
          <div class="card-list">
            <button v-for="item in midApp.avatar.modes" :key="item.id" class="choice-btn avatar-mode-btn" :class="{ active: mode.id === item.id }" @click="mode = item">
              <Sparkles :size="16" /> {{ item.name }}
            </button>
          </div>
          <label class="screen-label">学生现场提问</label>
          <input v-model="studentQuestion" placeholder="输入学生在课堂中的提问" />
          <div class="preview-paper">
            <h2>数字人回应草稿</h2>
            <pre>{{ replyDraft || '点击“生成回应”后查看数字人互动讲解内容。' }}</pre>
          </div>
          <div class="bottom-action-bar">
            <UiButton variant="secondary" @click="openScriptDialog('tips')"><Volume2 :size="16" /> 查看提示</UiButton>
            <UiButton variant="secondary" @click="copyScript"><Copy :size="16" /> {{ copied ? '已复制' : '复制脚本' }}</UiButton>
            <UiButton variant="secondary" @click="generateReply"><WandSparkles :size="16" /> 生成回应</UiButton>
            <UiButton @click="startInteraction"><Play :size="16" /> 启动数字人</UiButton>
          </div>
        </div>
      </div>

      <div class="editor-card">
        <div class="panel-headline">
          <div>
            <p class="hero-kicker">互动日志</p>
            <h3>课堂中的数字人调用记录</h3>
          </div>
        </div>
        <div class="card-list">
          <article v-for="item in interactionLog" :key="item" class="data-card">
            <p>{{ item }}</p>
          </article>
          <article v-if="!interactionLog.length" class="data-card">
            <p>尚未启动数字人互动，可先选择场景和风格后开始讲解。</p>
          </article>
        </div>
      </div>

      <UiDialog v-model:open="scriptOpen" title="数字人互动脚本" description="基于当前课堂场景和风格生成的互动脚本。">
        <UiTabs v-model="scriptTab" :items="tabs" />
        <div v-if="scriptTab === 'script'" class="preview-paper">
          <pre>{{ generatedScript }}</pre>
        </div>
        <div v-else class="preview-paper">
          <ul>
            <li v-for="tip in interactionTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
