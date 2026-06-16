<script setup>
import { computed, ref, nextTick } from 'vue'
import { Bot, Send, Sparkles, Trash2 } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import waitImg from '../assets/img/wait.png'
import thinkImg from '../assets/img/think.png'
import replyImg from '../assets/img/reply.png'
import { chat } from '../api/deepseek'

const appName = '中年骨干教师端'
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

/* ==================== 交互方法 ==================== */
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
      <!-- ========== 左侧面板：数字人 + 教学风格 ========== -->
      <aside class="avatar-left">
        <div class="editor-card avatar-panel-card">
          <!-- 数字人舞台（小尺寸） -->
          <div class="avatar-stage" :class="`avatar-status-${avatarStatus}`">
            <Transition name="avatar-fade" mode="out-in">
              <img :key="avatarStatus" :src="avatarImg" :alt="statusList.find(s => s.key === avatarStatus)?.label" class="avatar-img" />
            </Transition>
            <span class="avatar-stage-badge">
              <Sparkles :size="12" />
              {{ statusList.find((s) => s.key === avatarStatus)?.label }}
            </span>
          </div>

          <!-- 状态切换 -->
          <div class="avatar-status-bar">
            <button
              v-for="item in statusList" :key="item.key"
              class="choice-btn status-btn"
              :class="{ active: avatarStatus === item.key }"
              @click="avatarStatus = item.key"
            >{{ item.label }}</button>
          </div>
        </div>

        <!-- 教学风格 -->
        <div class="editor-card teaching-style-card">
          <p class="hero-kicker">教学风格</p>
          <div class="style-grid">
            <button
              v-for="s in styles" :key="s"
              class="choice-btn style-item-btn"
              :class="{ active: activeStyle === s }"
              @click="switchStyle(s)"
            >{{ s }}</button>
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
/* ═══════════════ 整体布局 ═══════════════ */
.avatar-workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 24px;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.avatar-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.avatar-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

/* ═══════════════ 左侧面板 ═══════════════ */
.avatar-panel-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

/* 数字人舞台 — 紧凑尺寸 */
.avatar-stage {
  position: relative;
  border-radius: var(--radius-md);
  background: linear-gradient(170deg, #FDF9F2 0%, #F8F2E8 40%, #F3ECE0 100%);
  border: 1px solid var(--border-light);
  height: 240px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-stage-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255,255,255,.9);
  font-size: .72rem;
  color: var(--primary-strong);
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.avatar-fade-enter-active,
.avatar-fade-leave-active { transition: opacity .25s ease; }
.avatar-fade-enter-from { opacity: 0; }
.avatar-fade-leave-to { opacity: 0; }

.avatar-status-bar { display: flex; gap: 6px; }
.status-btn { flex: 1; font-size: .78rem; min-height: 34px; padding: 0 6px; }

/* 教学风格 */
.teaching-style-card { padding: 16px; }
.teaching-style-card .hero-kicker { margin-bottom: 8px; }
.style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.style-item-btn { font-size: .8rem; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; }

/* ═══════════════ 右侧：聊天工作区 ═══════════════ */
.right-title-card { flex-shrink: 0; }

.style-chat-tabs { display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
.style-chat-tabs .choice-btn { font-size: .78rem; min-height: 32px; padding: 0 12px; }
.style-msg-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; border-radius: 9px;
  background: var(--primary); color: #fff;
  font-size: .65rem; font-weight: 600; margin-left: 4px; padding: 0 5px;
}

/* ═══════════════ 对话区 ═══════════════ */
.chat-card { flex: 1 1 0; display: flex; flex-direction: column; min-height: 300px; padding: 20px; }
.chat-messages { flex: 1 1 0; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; min-height: 0; padding-right: 4px; }

.chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; padding: 48px 24px; }
.chat-empty-icon { width: 64px; height: 64px; border-radius: var(--radius-lg); background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 8px; }
.chat-empty p { color: var(--text-soft); font-size: .9rem; margin: 0; }
.chat-empty small { color: var(--text-faint); font-size: .78rem; }

/* 消息气泡 */
.chat-message { display: flex; gap: 12px; align-items: flex-start; }
.msg-user { flex-direction: row-reverse; }
.msg-avatar { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 600; flex-shrink: 0; }
.msg-user .msg-avatar { background: var(--primary); color: #fff; }
.msg-ai .msg-avatar { background: #3B82F6; color: #fff; }
.msg-body { flex: 1; min-width: 0; }
.msg-bubble { padding: 14px 18px; border-radius: var(--radius-lg); font-size: .9rem; line-height: 1.75; color: var(--text); white-space: pre-wrap; word-break: break-word; }
.msg-user .msg-bubble { background: var(--primary-light); border: 1px solid rgba(217,140,82,.15); }
.msg-ai .msg-bubble { background: var(--surface); border: 1px solid var(--border-light); box-shadow: var(--shadow-xs); }
.msg-typing { display: flex; align-items: center; gap: 5px; padding: 14px 20px; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); }

.typing-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-faint); animation: typingBounce 1.2s ease-in-out infinite; }
.typing-dot:nth-child(2) { animation-delay: .15s; }
.typing-dot:nth-child(3) { animation-delay: .3s; }
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 输入区 */
.input-card { flex-shrink: 0; }
.chat-input {
  width: 100%; padding: 12px 16px; border: 1px solid var(--border);
  border-radius: var(--radius-md); font-size: .92rem; color: var(--text);
  background: var(--surface); outline: none; resize: none;
  font-family: inherit; line-height: 1.7;
  transition: border .2s, box-shadow .2s;
}
.chat-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(217,140,82,.12); background: #fff; }
.chat-input::placeholder { color: var(--text-faint); }

/* ═══════════════ 响应式 ═══════════════ */

/* 中等屏 */
@media (max-width: 1280px) {
  .avatar-workspace { grid-template-columns: 280px minmax(0, 1fr); gap: 16px; }
  .avatar-stage { height: 200px; }
}

/* <= 1100px：单列，数字人保持 cover */
@media (max-width: 1100px) {
  .avatar-workspace { grid-template-columns: 1fr; gap: 16px; }
  .avatar-left { display: grid; grid-template-columns: 200px 1fr; gap: 14px; align-items: start; }
  .avatar-panel-card { padding: 14px; }
  .avatar-stage { height: 200px; }
  .teaching-style-card { padding: 14px; }
}

/* <= 778px：数字人收窄为 168×198，横排布局 */
@media (max-width: 778px) {
  .avatar-workspace { grid-template-columns: 1fr; gap: 14px; }
  .avatar-left { display: grid; grid-template-columns: 168px 1fr; gap: 14px; align-items: start; }
  .avatar-panel-card { padding: 12px; }
  .avatar-stage { width: 168px; height: 198px; flex: none; }
  .teaching-style-card { padding: 12px; }
  .style-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .style-item-btn { font-size: .76rem; min-height: 36px; }
}

/* 平板 */
@media (max-width: 600px) {
  .avatar-left { grid-template-columns: 1fr; }
  .avatar-stage { width: 168px; height: 198px; margin: 0 auto; }
  .chat-card { min-height: 240px; padding: 14px; }
}

/* 手机 */
@media (max-width: 400px) {
  .avatar-stage { width: 140px; height: 168px; }
  .style-grid { grid-template-columns: 1fr 1fr; }
  .chat-card { min-height: 180px; padding: 10px; }
}
</style>
