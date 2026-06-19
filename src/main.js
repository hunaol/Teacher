/**
 * main.js — 应用入口
 * ====================================================
 * 负责：
 *  1. 创建 Vue 应用并挂载 Element Plus
 *  2. 注入与品牌色统一的自定义主题变量
 *  3. 注册全部路由表
 *  4. 路由守卫：根据登录状态、用户角色（资深/中级/新手）控制访问
 *  5. 启动前从本地存储恢复用户信息
 */
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'

// === Element Plus 主题覆盖：与项目主色（暖橙）保持一致 =====================
const elThemeStyle = document.createElement('style')
elThemeStyle.textContent = `
  :root {
    --el-color-primary: #D98C52;
    --el-color-primary-light-3: #E5B080;
    --el-color-primary-light-5: #F0CDB0;
    --el-color-primary-light-7: #F8E8D8;
    --el-color-primary-light-8: #FCF3EB;
    --el-color-primary-light-9: #FDF9F5;
    --el-color-primary-dark-2: #C97838;
    --el-border-radius-base: 10px;
    --el-border-radius-small: 6px;
    --el-border-radius-round: 20px;
    --el-font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
`
document.head.appendChild(elThemeStyle)

// === 页面级组件导入 ====================================================
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'
import SeniorLessonPage from './pages/SeniorLessonPage.vue'
import SeniorReflectionPage from './pages/SeniorReflectionPage.vue'
import MidDiagnosisPage from './pages/MidDiagnosisPage.vue'
import MidAvatarPage from './pages/MidAvatarPage.vue'
import MidResearchPage from './pages/MidResearchPage.vue'
import NoviceLibraryPage from './pages/NoviceLibraryPage.vue'
import NoviceQaPage from './pages/NoviceQaPage.vue'
import NovicePortfolioPage from './pages/NovicePortfolioPage.vue'
import LocalCasePage from './pages/LocalCasePage.vue'
import CoursePage from './pages/CoursePage.vue'
import ExperiencePage from './pages/ExperiencePage.vue'
import FilePage from './pages/FilePage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import ReportPage from './pages/ReportPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import { useAuthStore } from './stores/authStore'

// === 路由权限配置 =====================================================
/** 无需登录即可访问的路径（首页 / 选择 / 三种登录页） */
const PUBLIC_PATHS = ['/', '/choose', '/senior/login', '/mid/login', '/novice/login']

/** 每种教师身份登录后的默认首页 */
const ROLE_HOME = {
  senior: '/senior/lesson',
  mid: '/mid/diagnosis',
  novice: '/novice/library',
}

/** 每种身份允许访问的路由白名单 */
const ROLE_ROUTES = {
  senior: ['/senior/lesson', '/senior/reflection'],
  mid: ['/mid/diagnosis', '/mid/avatar', '/mid/research'],
  novice: ['/novice/library', '/novice/qa', '/novice/portfolio'],
}

// 工具：根据角色前缀拼接登录页路径
function loginPath(prefix) {
  return `/${prefix}/login`
}

// 工具：解析路径所属角色（路径首位段）
function routeRole(path) {
  const prefix = path.split('/')[1]
  return ROLE_HOME[prefix] ? prefix : ''
}

// 工具：归一化用户身上的教师身份列表
function teacherTypesOf(user) {
  if (!user) return []
  if (Array.isArray(user.teacherTypes) && user.teacherTypes.length) {
    return user.teacherTypes
  }
  return user.teacherType ? [user.teacherType] : []
}

// 工具：判断用户是否具备某教师身份
function hasTeacherType(user, teacherType) {
  return teacherTypesOf(user).includes(teacherType)
}

// 工具：获取当前用户的主教师身份
function currentTeacherType(user) {
  const types = teacherTypesOf(user)
  if (user?.teacherType && types.includes(user.teacherType)) {
    return user.teacherType
  }
  return types[0] || ''
}

// === 路由表 ===========================================================
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/choose', name: 'choose', component: HomePage },
    { path: '/senior', redirect: '/senior/login' },
    { path: '/senior/login', component: LoginPage },
    { path: '/senior/lesson', component: SeniorLessonPage },
    { path: '/senior/reflection', component: SeniorReflectionPage },
    { path: '/mid', redirect: '/mid/login' },
    { path: '/mid/login', component: LoginPage },
    { path: '/mid/diagnosis', component: MidDiagnosisPage },
    { path: '/mid/avatar', component: MidAvatarPage },
    { path: '/mid/research', component: MidResearchPage },
    { path: '/novice', redirect: '/novice/login' },
    { path: '/novice/login', component: LoginPage },
    { path: '/novice/library', component: NoviceLibraryPage },
    { path: '/novice/qa', component: NoviceQaPage },
    { path: '/novice/portfolio', component: NovicePortfolioPage },
    { path: '/cases', component: LocalCasePage },
    { path: '/courses', component: CoursePage },
    { path: '/experience', component: ExperiencePage },
    { path: '/files', component: FilePage },
    { path: '/profile', component: ProfilePage },
    { path: '/reports', component: ReportPage },
    { path: '/dashboard', component: DashboardPage },
  ],
  // 切换路由时统一滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  },
})

// 启动时尝试从本地存储恢复登录信息
useAuthStore().fetchUser()

// === 路由守卫 =========================================================
router.beforeEach((to) => {
  const { isAuthenticated, user } = useAuthStore()
  const targetRole = routeRole(to.path)

  // 公开页：已登录用户访问登录页时根据身份跳转到对应首页
  if (PUBLIC_PATHS.includes(to.path)) {
    if (isAuthenticated.value && to.path.includes('/login')) {
      if (!user.value) {
        return true
      }
      if (targetRole && hasTeacherType(user.value, targetRole)) {
        return ROLE_HOME[targetRole]
      }
      return true
    }
    return true
  }

  // 受保护页面：未登录则跳转至对应角色登录页
  if (!isAuthenticated.value) {
    return targetRole ? loginPath(targetRole) : '/'
  }

  // 等待用户信息加载完成
  if (!user.value) {
    return true
  }

  // 当前账号未注册目标角色身份
  if (targetRole && !hasTeacherType(user.value, targetRole)) {
    ElMessage.warning('当前账号未注册该教师身份，请先登录或注册该端身份')
    return loginPath(targetRole)
  }

  // 跨角色互访：若主角色与目标路由不匹配，给出提示并跳回登录页
  const role = currentTeacherType(user.value)
  if (role && ROLE_ROUTES[role] && !ROLE_ROUTES[role].includes(to.path)) {
    const otherRole = Object.keys(ROLE_ROUTES).find((item) => ROLE_ROUTES[item].includes(to.path))
    if (otherRole && !hasTeacherType(user.value, otherRole)) {
      ElMessage.warning('当前账号未注册该教师身份，请先登录或注册该端身份')
      return loginPath(otherRole)
    }
  }

  return true
})

// === 启动应用 =========================================================
createApp(App).use(router).use(ElementPlus).mount('#app')
