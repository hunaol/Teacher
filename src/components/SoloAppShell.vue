<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Bell, BookOpen, BrainCircuit, BriefcaseBusiness, ChartNoAxesColumn, CircleHelp, FileText, GraduationCap, LayoutGrid, LibraryBig, LogOut, Menu, Mic, NotebookPen, Sparkles, Telescope, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { ref, onMounted } from 'vue'
import { listNotifications, markNotificationRead } from '../api/notification'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

const props = defineProps({
  appName: String,
  title: String,
  subtitle: String,
  stats: { type: Array, default: () => [] },
  navItems: { type: Array, default: () => [] },
  theme: String,
  hideMainHeader: { type: Boolean, default: false },
})

const route = useRoute()
const { logout } = useAuthStore()
const notifications = ref([])
const notifOpen = ref(false)
const toolsOpen = ref(false)
const userMenuOpen = ref(false)

const toolLinks = [
  { path: '/profile', label: '个人中心', icon: User },
  { path: '/cases', label: '乡土案例', icon: BookOpen },
  { path: '/courses', label: '培训课程', icon: LayoutGrid },
  { path: '/experience', label: '经验册', icon: FileText },
  { path: '/files', label: '文件管理', icon: FileText },
  { path: '/reports', label: '报告中心', icon: FileText },
]

async function loadNotifs() { try { notifications.value = await listNotifications(true) } catch { /* */ } }
async function readNotif(id) { try { await markNotificationRead(id); notifications.value = notifications.value.filter((n) => n.id !== id) } catch { /* */ } }
onMounted(() => { loadNotifs() })
const active = computed(() => route.path)

const themeMeta = computed(() => {
  if (props.theme === 'senior') {
    return {
      label: '资深教师端',
      hint: '经验沉淀工作台',
      icon: NotebookPen,
      checklist: ['今天完成 1 份教案草稿', '补充 1 条课堂反思记录', '整理本周案例素材'],
    }
  }
  if (props.theme === 'mid') {
    return {
      label: '骨干教师端',
      hint: '诊断研究工作台',
      icon: BrainCircuit,
      checklist: ['处理 2 份错题样本', '完成 1 次数字助教脚本', '更新课题进展摘要'],
    }
  }
  return {
    label: '新任教师端',
    hint: '成长学习工作台',
    icon: GraduationCap,
    checklist: ['学习 1 条名师经验', '提交 1 条在线提问', '更新成长档案条目'],
  }
})

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

function getNavIcon(path) {
  return iconMap[path] || themeMeta.value.icon
}

function getStatIcon(label) {
  const key = Object.keys(statIconMap).find((item) => label.includes(item))
  return key ? statIconMap[key] : themeMeta.value.icon
}

const activeNav = computed(() => props.navItems.find((item) => item.path === active.value) ?? props.navItems[0] ?? null)
const routeClass = computed(() => active.value.replace(/^\//, '').replace(/\//g, '-'))
</script>

<template>
  <div class="app-shell product-shell app-shell-topbar" :class="[`theme-${theme}`, `route-${routeClass}`]">
    <header class="social-topbar">
      <div class="social-topbar-main">
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
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="social-nav-item"
            :class="{ active: active === item.path }"
          >
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
          <button class="app-sidebar-home social-home-link desktop-only-inline" @click="notifOpen = !notifOpen; loadNotifs()" style="position:relative">
            <Bell :size="16" />
            <span v-if="notifications.length" style="position:absolute;top:-4px;right:-6px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;line-height:16px;text-align:center">{{ notifications.length }}</span>
          </button>
          <div class="tools-dropdown-wrapper">
            <button class="app-sidebar-home social-home-link desktop-only-inline" @click="toolsOpen = !toolsOpen">
              <Menu :size="16" /> 工具
            </button>
            <div v-if="toolsOpen" class="tools-dropdown-panel" @click.stop>
              <RouterLink v-for="t in toolLinks" :key="t.path" :to="t.path" class="tools-dropdown-item" @click="toolsOpen = false">
                <component :is="t.icon" :size="16" />
                <span>{{ t.label }}</span>
              </RouterLink>
            </div>
          </div>
          <RouterLink to="/" class="app-sidebar-home social-home-link desktop-only-inline">
            <ArrowLeft :size="16" />
            返回首页
          </RouterLink>
          <button class="app-sidebar-home social-home-link desktop-only-inline logout-btn" @click="logout">
            <LogOut :size="16" />
            退出
          </button>
        </div>
      </div>
      <div v-if="notifOpen" class="editor-card" style="position:absolute;top:56px;right:16px;width:320px;z-index:100;max-height:400px;overflow-y:auto">
        <div class="card-list">
          <article v-for="n in notifications" :key="n.id" class="data-card" @click="readNotif(n.id)" style="cursor:pointer">
            <strong>{{ n.title }}</strong><p>{{ n.content }}</p><small>{{ n.createdAt }}</small>
          </article>
          <p v-if="!notifications.length">暂无通知</p>
        </div>
      </div>
    </header>

    <div class="app-main topbar-main">
      <main class="app-content topbar-content workspace-layout center-only-layout">
        <aside class="workspace-leftbar desktop-only-side">
          <slot name="left">
            <div class="workspace-default-tools"></div>
          </slot>
        </aside>

        <section class="workspace-main">
          <header v-if="!hideMainHeader" class="app-header product-app-header social-app-header">
            <div class="social-app-copy">
              <div class="social-header-meta">
                <UiBadge>
                  <component :is="getNavIcon(activeNav?.path || '')" :size="14" />
                  {{ activeNav?.name || themeMeta.label }}
                </UiBadge>
                <span v-if="activeNav" class="header-channel">{{ activeNav.path }}</span>
              </div>
              <h1>{{ title }}</h1>
              <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>

              <section v-if="stats.length" class="stats-ribbon" aria-label="页面概览">
                <UiCard v-for="item in stats" :key="item.label" class="stat-pill-card">
                  <div class="stat-pill-top">
                    <span class="stat-pill-icon">
                      <component :is="getStatIcon(item.label)" :size="16" />
                    </span>
                    <span>{{ item.label }}</span>
                  </div>
                  <strong>{{ item.value }}</strong>
                </UiCard>
              </section>
            </div>
          </header>

          <slot />
        </section>

        <aside class="workspace-rightbar desktop-only-side">
          <slot name="right">
          </slot>
        </aside>
      </main>
    </div>

    <nav class="mobile-tabbar">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="mobile-tab"
        :class="{ active: active === item.path }"
      >
        <component :is="getNavIcon(item.path)" :size="18" />
        <b>{{ item.name }}</b>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
@media (max-width: 768px) { .tools-dropdown-panel { right: -60px; width: 180px; } }
@media (max-width: 480px) { .tools-dropdown-panel { right: -80px; width: 160px; } .tools-dropdown-item { padding: 8px 10px; font-size: .8rem; } }
</style>
