<!--
  SoloAppShell.vue — 应用整体布局壳
  ====================================================
  本组件为所有教师角色（senior / mid / novice）工作台页面提供统一外壳，包含：
    1. 顶部社交式导航栏（品牌、导航项、主题徽章、通知、工具菜单、退出）
    2. 移动端侧边抽屉菜单
    3. 桌面端左侧栏（具名插槽 left）
    4. 主内容区（默认插槽） + 右侧栏（具名插槽 right）
    5. 移动端底部 Tab 栏

  通过 props 接收 appName、title、subtitle、navItems、theme、stats、hideMainHeader，
  让业务页面只关心核心内容，不必重复布局代码。
-->
<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Bell, BookOpen, BrainCircuit, BriefcaseBusiness, ChartNoAxesColumn, CircleHelp, FileText, GraduationCap, LayoutGrid, LibraryBig, LogOut, Menu, Mic, NotebookPen, Sparkles, Telescope, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { ref, onMounted } from 'vue'
import { listNotifications, markNotificationRead } from '../api/notification'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

// 组件属性定义：业务页面通过这些 props 定制外壳
const props = defineProps({
  // 品牌名（顶部 Logo 旁）
  appName: String,
  // 页面主标题
  title: String,
  // 标题下方的副标题
  subtitle: String,
  // 顶部主导航项
  stats: { type: Array, default: () => [] },
  // 导航配置：[{ path, name }]
  navItems: { type: Array, default: () => [] },
  // 主题：senior | mid | novice，决定图标、徽章文案、checklist
  theme: String,
  // 是否隐藏主区上方的大标题区
  hideMainHeader: { type: Boolean, default: false },
})

const route = useRoute()
const { logout } = useAuthStore()
const notifications = ref([])
const notifOpen = ref(false)
const toolsOpen = ref(false)
const userMenuOpen = ref(false)

// 工具菜单中的快捷入口
const toolLinks = [
  { path: '/profile', label: '个人中心', icon: User },
  { path: '/cases', label: '乡土案例', icon: BookOpen },
  { path: '/courses', label: '培训课程', icon: LayoutGrid },
  { path: '/experience', label: '经验册', icon: FileText },
  { path: '/files', label: '文件管理', icon: FileText },
  { path: '/reports', label: '报告中心', icon: FileText },
]

/** 拉取未读通知（仅在打开通知面板时刷新） */
async function loadNotifs() { try { notifications.value = await listNotifications(true) } catch { /* 接口异常时静默 */ } }
/** 标记单条通知为已读（从列表中移除即可，无需再请求全量） */
async function readNotif(id) { try { await markNotificationRead(id); notifications.value = notifications.value.filter((n) => n.id !== id) } catch { /* */ } }

// 进入页面时主动加载一次（用于显示未读数量小红点）
onMounted(() => { loadNotifs() })
// 当前路由路径，用于高亮导航项
const active = computed(() => route.path)

/** 不同教师类型对应的主题信息：标签、提示语、图标、checklist */
const themeMeta = computed(() => {
  if (props.theme === 'senior') {
    return {
      label: '老年资深教师端',
      hint: '经验沉淀工作台',
      icon: NotebookPen,
      checklist: ['今天完成 1 份教案草稿', '补充 1 条课堂反思记录', '整理本周案例素材'],
    }
  }
  if (props.theme === 'mid') {
    return {
      label: '中年骨干教师端',
      hint: '诊断研究工作台',
      icon: BrainCircuit,
      checklist: ['处理 2 份错题样本', '完成 1 次数字助教脚本', '更新课题进展摘要'],
    }
  }
  return {
    label: '新任青年教师端',
    hint: '成长学习工作台',
    icon: GraduationCap,
    checklist: ['学习 1 条名师经验', '提交 1 条在线提问', '更新成长档案条目'],
  }
})

// 顶部导航项：path → 图标组件
const iconMap = {
  '/senior/lesson': Mic,
  '/senior/reflection': FileText,
  '/mid/diagnosis': ChartNoAxesColumn,
  '/mid/avatar': Sparkles,
  '/mid/research': Telescope,
  '/novice/library': LibraryBig,
  '/novice/qa': CircleHelp,
  '/novice/portfolio': BriefcaseBusiness,
}

// 顶部统计卡：label 关键词 → 图标组件
const statIconMap = {
  教案: BookOpen,
  版本: LayoutGrid,
  案例: NotebookPen,
  反思: FileText,
  问题: CircleHelp,
  样本: ChartNoAxesColumn,
  建议: Sparkles,
  档案: BriefcaseBusiness,
  课题: Telescope,
  经验: LibraryBig,
  互动: Sparkles,
  报告: FileText,
}

/** 解析导航项对应的图标（按 path 精确匹配） */
function getNavIcon(path) {
  return iconMap[path] || themeMeta.value.icon
}

/** 解析统计卡对应的图标（按 label 关键词模糊匹配） */
function getStatIcon(label) {
  const key = Object.keys(statIconMap).find((item) => label.includes(item))
  return key ? statIconMap[key] : themeMeta.value.icon
}

// 移动端侧边抽屉的显隐状态
const mobileMenuOpen = ref(false)
// 当前激活的导航项
const activeNav = computed(() => props.navItems.find((item) => item.path === active.value) ?? props.navItems[0] ?? null)
// 用于根容器 class，例如 route-mid-avatar
const routeClass = computed(() => active.value.replace(/^\//, '').replace(/\//g, '-'))
</script>

<template>
  <div class="app-shell product-shell app-shell-topbar" :class="[`theme-${theme}`, `route-${routeClass}`]">
    <header class="social-topbar">
      <div class="social-topbar-main">
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="菜单">
          <Menu :size="20" />
        </button>
        <RouterLink to="/" class="social-brand">
          <div class="brand-mark brand-mark-icon">
            <component :is="themeMeta.icon" :size="18" />
          </div>
          <div>
            <strong>{{ appName }}</strong>
            <p>{{ themeMeta.hint }}</p>
          </div>
        </RouterLink>

        <nav class="social-nav" aria-label="页面导航">
          <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="social-nav-item"
            :class="{ active: active === item.path }">
            <span class="social-nav-icon">
              <component :is="getNavIcon(item.path)" :size="18" />
            </span>
            <strong>{{ item.name }}</strong>
          </RouterLink>
        </nav>

        <div class="social-actions">
          <UiBadge>
            <component :is="themeMeta.icon" :size="14" />
            {{ themeMeta.label }}
          </UiBadge>
          <button class="app-sidebar-home social-home-link desktop-only-inline"
            @click="notifOpen = !notifOpen; loadNotifs()" style="position:relative">
            <Bell :size="16" />
            <span v-if="notifications.length"
              style="position:absolute;top:-4px;right:-6px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;line-height:16px;text-align:center">{{
                notifications.length }}</span>
          </button>
          <div class="tools-dropdown-wrapper">
            <button class="app-sidebar-home social-home-link desktop-only-inline" @click="toolsOpen = !toolsOpen">
              <Menu :size="16" /> 工具
            </button>
            <div v-if="toolsOpen" class="tools-dropdown-panel" @click.stop>
              <RouterLink v-for="t in toolLinks" :key="t.path" :to="t.path" class="tools-dropdown-item"
                @click="toolsOpen = false">
                <component :is="t.icon" :size="16" />
                <span>{{ t.label }}</span>
              </RouterLink>
            </div>
          </div>
          <button class="app-sidebar-home social-home-link desktop-only-inline keep-mobile" @click="$router.back()">
            <ArrowLeft :size="16" />
          </button>
          <button class="app-sidebar-home social-home-link desktop-only-inline logout-btn keep-mobile" @click="logout">
            <LogOut :size="16" />
            退出
          </button>
        </div>
      </div>
      <div v-if="notifOpen" class="editor-card"
        style="position:absolute;top:56px;right:16px;width:320px;z-index:100;max-height:400px;overflow-y:auto">
        <div class="card-list">
          <article v-for="n in notifications" :key="n.id" class="data-card" @click="readNotif(n.id)"
            style="cursor:pointer">
            <strong>{{ n.title }}</strong>
            <p>{{ n.content }}</p><small>{{ n.createdAt }}</small>
          </article>
          <p v-if="!notifications.length">暂无通知</p>
        </div>
      </div>
    </header>

    <!-- 移动端侧边抽屉 -->
    <Transition name="drawer">
      <div v-if="mobileMenuOpen" class="mobile-drawer-overlay" @click.self="mobileMenuOpen = false">
        <div class="mobile-drawer">
          <div class="mobile-drawer-head">
            <strong>{{ appName }}</strong>
            <button class="mobile-drawer-close" @click="mobileMenuOpen = false">&times;</button>
          </div>
          <div class="mobile-drawer-nav">
            <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="mobile-drawer-item"
              :class="{ active: active === item.path }" @click="mobileMenuOpen = false">
              <component :is="getNavIcon(item.path)" :size="16" />
              <span>{{ item.name }}</span>
            </RouterLink>
          </div>
          <div class="mobile-drawer-tools">
            <RouterLink v-for="t in toolLinks" :key="t.path" :to="t.path" class="mobile-drawer-item"
              @click="mobileMenuOpen = false">
              <component :is="t.icon" :size="16" />
              <span>{{ t.label }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>

    <div class="app-main topbar-main">
      <aside v-if="$slots.left" class="workspace-leftbar desktop-only-side">
        <slot name="left" />
      </aside>

      <main class="workspace-main app-content">
        <section class="workspace-main-inner">
          <header v-if="!hideMainHeader" class="app-header product-app-header social-app-header">
            <div class="social-app-copy">
              <div class="social-header-meta">
                <UiBadge>
                  <component :is="getNavIcon(activeNav?.path || '')" :size="14" />
                  {{ activeNav?.name || themeMeta.label }}
                </UiBadge>
              </div>
              <h1>{{ title }}</h1>
              <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
            </div>
          </header>

          <slot />
        </section>
      </main>

      <aside v-if="$slots.right" class="workspace-rightbar desktop-only-side">
        <slot name="right" />
      </aside>
    </div>

    <nav class="mobile-tabbar">
      <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="mobile-tab"
        :class="{ active: active === item.path }">
        <component :is="getNavIcon(item.path)" :size="18" />
        <b>{{ item.name }}</b>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* 确保内容区填充可用高度 */
.workspace-main-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
}

.mobile-menu-btn:hover {
  background: var(--bg-soft);
}

/* 移动端抽屉 */
.mobile-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, .4);
  backdrop-filter: blur(2px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--surface);
  z-index: 101;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow-y: auto;
}

.mobile-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-light);
}

.mobile-drawer-head strong {
  font-size: 1.1rem;
}

.mobile-drawer-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-soft);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.mobile-drawer-close:hover {
  background: var(--bg-soft);
}

.mobile-drawer-nav,
.mobile-drawer-tools {
  padding: 12px;
  display: grid;
  gap: 4px;
}

.mobile-drawer-tools {
  border-top: 1px solid var(--border-light);
}

.mobile-drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  color: var(--text-soft);
  text-decoration: none;
  font-size: .9rem;
  transition: all .15s ease;
}

.mobile-drawer-item:hover {
  background: var(--bg-soft);
  color: var(--text);
}

.mobile-drawer-item.active {
  background: var(--primary-light);
  color: var(--primary-strong);
  font-weight: 600;
}

/* 抽屉动画 */
.drawer-enter-active {
  transition: all .25s ease-out;
}

.drawer-leave-active {
  transition: all .2s ease-in;
}

.drawer-enter-from .mobile-drawer {
  transform: translateX(-100%);
}

.drawer-enter-to .mobile-drawer {
  transform: translateX(0);
}

.drawer-leave-from .mobile-drawer {
  transform: translateX(0);
}

.drawer-leave-to .mobile-drawer {
  transform: translateX(-100%);
}

.drawer-enter-from.mobile-drawer-overlay,
.drawer-leave-to.mobile-drawer-overlay {
  opacity: 0;
}

.drawer-enter-to.mobile-drawer-overlay,
.drawer-leave-from.mobile-drawer-overlay {
  opacity: 1;
}

@media (max-width: 1200px) {
  .mobile-menu-btn {
    display: flex;
    align-items: center;
  }

  .social-actions .social-home-link.desktop-only-inline:not(.logout-btn) {
    display: none !important;
  }

  .tools-dropdown-panel {
    right: -60px;
    width: 180px;
    z-index: 60;
  }
}

@media (max-width: 480px) {
  .tools-dropdown-panel {
    right: -80px;
    width: 160px;
  }

  .tools-dropdown-item {
    padding: 8px 10px;
    font-size: .8rem;
  }
}
</style>
