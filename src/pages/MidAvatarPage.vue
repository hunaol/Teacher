<script setup>
import { computed, ref, nextTick } from 'vue'
import { Bot, Send, Sparkles, Trash2 } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import waitImg from '../assets/img/wait.png'
import thinkImg from '../assets/img/think.png'
import replyImg from '../assets/img/reply.png'
import { chat } from '../api/deepseek'

const appName = '骨干教师端'
const pageTitle = '智能数字人'
const theme = 'mid'
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

/* ==================== 数字人状态 ==================== */
const avatarStatus = ref('idle')
const statusList = [
  { key: 'idle', label: '待机中', img: waitImg },
  { key: 'speaking', label: '讲解中', img: replyImg },
  { key: 'thinking', label: '思考中', img: thinkImg },
]
const avatarImg = computed(() => statusList.find((s) => s.key === avatarStatus.value)?.img ?? waitImg)

/* ==================== 教学风格 ==================== */
const activeStyle = ref('启发式教学')
const styles = ['启发式教学', '故事化教学', '互动教学', '考试冲刺']

/* ==================== 教学案例 ==================== */
const teachingCases = [
  { title: '线段与射线', desc: '直线、线段与射线的区别与联系', prompt: '请帮我设计一个关于线段与射线的课堂讲解方案。' },
  { title: '分数概念教学', desc: '分数的意义与基本性质', prompt: '如何向学生讲解分数的概念？请设计一个互动教学方案。' },
  { title: '勾股定理讲解', desc: '勾股定理的证明与应用', prompt: '请帮我设计勾股定理的课堂讲解，包含证明演示和生活实例。' },
  { title: '课堂互动设计', desc: '有效课堂提问与互动策略', prompt: '如何在数学课堂中设计有效的师生互动环节？' },
]

/* ==================== 对话区域 ==================== */
const inputText = ref('')
const allMessages = ref({})
const messagesRef = ref(null)
const sending = ref(false)

/* 当前风格的对话记录 */
const messages = computed(() => allMessages.value[activeStyle.value] || [])

/* 切换风格 */
function switchStyle(s) {
  activeStyle.value = s
  if (!allMessages.value[s]) allMessages.value[s] = []
  nextTick(() => { const el = messagesRef.value; if (el) el.scrollTop = el.scrollHeight })
}

/* 添加消息到当前风格 */
function addMsg(msg) {
  if (!allMessages.value[activeStyle.value]) allMessages.value[activeStyle.value] = []
  allMessages.value[activeStyle.value].push(msg)
}

const derivedStats = computed(() => [
  { label: '教学风格', value: activeStyle.value.slice(0, 4) },
  { label: '互动次数', value: String((allMessages.value[activeStyle.value] || []).filter((m) => m.role === 'user').length) },
  { label: '数字人状态', value: statusList.find((s) => s.key === avatarStatus.value)?.label ?? '—' },
])

/* ==================== 交互方法（预留接口） ==================== */
function selectCase(item) {
  inputText.value = item.prompt
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  addMsg({ role: 'user', content: text, time: Date.now() })
  inputText.value = ''
  sending.value = true
  avatarStatus.value = 'thinking'

  const history = (allMessages.value[activeStyle.value] || []).slice(0, -1)
  try {
    const reply = await chat({
      prompt: text,
      style: activeStyle.value,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    })
    addMsg({ role: 'ai', content: reply, time: Date.now() })
    avatarStatus.value = 'speaking'
    setTimeout(() => { avatarStatus.value = 'idle' }, 3000)
  } catch (err) {
    addMsg({ role: 'ai', content: `出错了：${err.message}`, time: Date.now() })
    avatarStatus.value = 'idle'
  } finally {
    sending.value = false
    await nextTick()
    scrollToBottom()
  }
}

function clearChat() {
  allMessages.value[activeStyle.value] = []
  avatarStatus.value = 'idle'
}

function scrollToBottom() {
  const el = messagesRef.value
  if (el) el.scrollTop = el.scrollHeight
}
</script>

<template>
  <SoloAppShell
    :app-name="appName"
    :title="pageTitle"
    subtitle="课堂讲解助手"
    :stats="derivedStats"
    :nav-items="navItems"
    :theme="theme"
    :hide-main-header="true"
  >
    <div class="avatar-workspace">
      <!-- ========== 左侧 40%：数字教师展示区 ========== -->
      <aside class="avatar-left">
        <!-- 数字人舞台卡片 -->
        <div class="editor-card avatar-showcase-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">数字教师</p>
              <h3>课堂讲解助手</h3>
            </div>
            <span class="status-pill">
              <Sparkles :size="14" />
              {{ statusList.find((s) => s.key === avatarStatus)?.label }}
            </span>
          </div>

          <!-- 数字人舞台 -->
          <div class="avatar-stage" :class="`avatar-status-${avatarStatus}`">
            <Transition name="avatar-fade" mode="out-in">
              <img :key="avatarStatus" :src="avatarImg" :alt="statusList.find(s => s.key === avatarStatus)?.label" class="avatar-img" />
            </Transition>
          </div>

          <!-- 数字人状态指示 -->
          <div class="avatar-status-bar">
            <button
              v-for="item in statusList"
              :key="item.key"
              class="choice-btn status-btn"
              :class="{ active: avatarStatus === item.key }"
              @click="avatarStatus = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 教学风格卡片 -->
        <div class="editor-card teaching-style-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">教学风格</p>
              <h3>选择讲解方式</h3>
            </div>
          </div>
          <div class="style-grid">
            <button
              v-for="s in styles"
              :key="s"
              class="choice-btn style-item-btn"
              :class="{ active: activeStyle === s }"
              @click="switchStyle(s)"
            >
              <Sparkles v-if="activeStyle === s" :size="14" />
              {{ s }}
            </button>
          </div>
        </div>
      </aside>

      <!-- ========== 右侧 60%：教学助手工作区 ========== -->
      <main class="avatar-right">
        <!-- 标题区域 -->
        <div class="editor-card right-title-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">AI 教学助手</p>
              <h3>输入教学问题获取课堂讲解建议</h3>
            </div>
          </div>
        </div>

        <!-- 教学案例网格 -->
        <div class="cases-grid">
          <button
            v-for="item in teachingCases"
            :key="item.title"
            class="editor-card case-card"
            @click="selectCase(item)"
          >
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
            <span class="case-arrow">点击使用 →</span>
          </button>
        </div>

        <!-- 风格对话标签 -->
        <div class="style-chat-tabs">
          <button
            v-for="s in styles"
            :key="s"
            class="choice-btn"
            :class="{ active: activeStyle === s }"
            @click="switchStyle(s)"
          >
            {{ s.slice(0, 4) }}
            <span v-if="(allMessages[s] || []).length" class="style-msg-count">{{ allMessages[s].length }}</span>
          </button>
        </div>

        <!-- 对话展示区域 -->
        <div class="editor-card chat-card">
          <div ref="messagesRef" class="chat-messages">
            <!-- 空状态 -->
            <div v-if="!messages.length" class="chat-empty">
              <div class="chat-empty-icon">
                <Bot :size="32" />
              </div>
              <p>输入教学问题，AI 教学助手将为你提供讲解建议</p>
              <small>可点击上方教学案例快速填充问题</small>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="chat-message"
              :class="`msg-${msg.role}`"
            >
              <div class="msg-avatar">
                {{ msg.role === 'user' ? '师' : 'AI' }}
              </div>
              <div class="msg-body">
                <div class="msg-bubble">{{ msg.content }}</div>
              </div>
            </div>

            <!-- 发送中指示 -->
            <div v-if="sending" class="chat-message msg-ai">
              <div class="msg-avatar">AI</div>
              <div class="msg-body">
                <div class="msg-bubble msg-typing">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部输入区 -->
        <div class="editor-card input-card">
          <textarea
            v-model="inputText"
            class="chat-input"
            placeholder="输入教学问题，如：请帮我设计一个关于分数概念教学的互动方案..."
            rows="3"
            @keydown.enter.exact.prevent="handleSend"
          ></textarea>
          <div class="bottom-action-bar">
            <button class="choice-btn" @click="clearChat" :disabled="!messages.length">
              <Trash2 :size="14" />
              清空对话
            </button>
            <button
              class="screen-primary"
              @click="handleSend"
              :disabled="!inputText.trim() || sending"
            >
              <Send :size="14" />
              发送
            </button>
          </div>
        </div>
      </main>
    </div>
  </SoloAppShell>
</template>

<style scoped>
/* ═══════════════════════════════════════════════
   智能数字人页面 —— 与系统原生风格完全一致
   色彩 / 圆角 / 阴影 / 字体 全部沿用 :root 变量
   ═══════════════════════════════════════════════ */

/* ── 整体布局：左右 40/60 ── */
.avatar-workspace {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 24px;
  height: calc(100svh - 56px - 56px); /* 减去顶部导航 + 底部移动端导航 */
  min-height: 680px;
}

.avatar-left,
.avatar-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* ═══════════════ 左侧：数字教师展示区 ═══════════════ */

.avatar-showcase-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* ── 数字人舞台 ── */
.avatar-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(170deg, #FDF9F2 0%, #F8F2E8 40%, #F3ECE0 100%);
  border: 1.5px solid var(--border);
  min-height: 320px;
  transition: border-color .4s;
  padding: 0;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

/* 图片切换动画 */
.avatar-fade-enter-active,
.avatar-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.avatar-fade-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.avatar-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* ── 数字人状态切换条 ── */
.avatar-status-bar {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.status-btn {
  flex: 1;
  font-size: .82rem;
  min-height: 36px;
  padding: 0 8px;
}

/* ── 教学风格卡片 ── */
.teaching-style-card {
  flex-shrink: 0;
}

.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.style-item-btn {
  font-size: .84rem;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ═══════════════ 右侧：教学助手工作区 ═══════════════ */

.avatar-right {
  min-height: 0;
}

.right-title-card {
  flex-shrink: 0;
}

/* ── 教学案例网格 ── */
.cases-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex-shrink: 0;
}

.case-card {
  padding: 16px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  transition: all .2s;
  font: inherit;
  color: var(--text);
}

.case-card:hover {
  border-color: var(--gold);
  box-shadow: 0 4px 16px rgba(180, 140, 80, 0.12);
  transform: translateY(-1px);
}

.case-card strong {
  font-size: .92rem;
}

.case-card small {
  color: var(--text-soft);
  font-size: .8rem;
  line-height: 1.5;
}

.case-arrow {
  color: var(--primary-strong);
  font-size: .75rem;
  font-weight: 500;
}

.style-chat-tabs {
  display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0;
}
.style-chat-tabs .choice-btn {
  font-size: .78rem; min-height: 32px; padding: 0 12px;
  position: relative;
}
.style-msg-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; border-radius: 9px;
  background: var(--primary); color: #fff;
  font-size: .65rem; font-weight: 600;
  margin-left: 4px; padding: 0 5px;
}

/* ── 对话区域 ── */
.chat-card {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  padding: 16px;
}

.chat-messages {
  flex: 1 1 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding-right: 4px;
}

@media (max-width: 1024px) { .chat-card { min-height: 220px; } }
@media (max-width: 640px) { .chat-card { min-height: 180px; } }

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

/* ── 空状态 ── */
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 48px 24px;
}

.chat-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface-strong);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
  margin-bottom: 8px;
}

.chat-empty p {
  color: var(--text-soft);
  font-size: .9rem;
  margin: 0;
}

.chat-empty small {
  color: var(--text-faint);
  font-size: .78rem;
}

/* ── 消息项 ── */
.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.msg-user .msg-avatar {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  color: #fff;
}

.msg-ai .msg-avatar {
  background: linear-gradient(135deg, var(--accent), #7FAE4E);
  color: #fff;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-bubble {
  background: var(--surface-strong);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: .9rem;
  line-height: 1.75;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-user .msg-bubble {
  background: linear-gradient(135deg, #FFF8F0, #FFF4E6);
  border-color: rgba(227, 146, 92, 0.2);
}

/* ── 输入中动画 ── */
.msg-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 20px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-faint);
  animation: typingBounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: .15s;
}

.typing-dot:nth-child(3) {
  animation-delay: .3s;
}

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ── 底部输入区 ── */
.input-card {
  flex-shrink: 0;
}

.chat-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: .92rem;
  color: var(--text);
  background: var(--surface);
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.7;
  transition: border .2s, box-shadow .2s;
}

.chat-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(227, 146, 92, 0.12);
  background: #fff;
}

.chat-input::placeholder {
  color: var(--text-faint);
}

/* ═══════════════ 响应式 ═══════════════ */
@media (max-width: 1280px) {
  .avatar-workspace { grid-template-columns: 26% 74%; gap: 14px; }
  .avatar-stage { min-height: 260px; }
  .cases-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 900px) {
  .avatar-stage { min-height: auto; aspect-ratio: 3 / 4; }
  .avatar-img { padding: 12px; }
}

@media (max-width: 768px) {
  .avatar-workspace { grid-template-columns: 1fr; height: auto; min-height: auto; }
  .avatar-stage { min-height: 240px; max-height: 320px; }
  .avatar-showcase-card { flex: auto; }
  .cases-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 640px) {
  .avatar-stage { min-height: 200px; max-height: 260px; }
  .cases-grid { grid-template-columns: 1fr; }
  .style-grid { grid-template-columns: 1fr 1fr; }
}
</style>
