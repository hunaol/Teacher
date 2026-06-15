import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'

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

const PUBLIC_PATHS = ['/', '/choose', '/senior/login', '/mid/login', '/novice/login']

const ROLE_HOME = {
  senior: '/senior/lesson',
  mid: '/mid/diagnosis',
  novice: '/novice/library',
}

const ROLE_ROUTES = {
  senior: ['/senior/lesson', '/senior/reflection'],
  mid: ['/mid/diagnosis', '/mid/avatar', '/mid/research'],
  novice: ['/novice/library', '/novice/qa', '/novice/portfolio'],
}

function loginPath(prefix) {
  return `/${prefix}/login`
}

function routeRole(path) {
  const prefix = path.split('/')[1]
  return ROLE_HOME[prefix] ? prefix : ''
}

function teacherTypesOf(user) {
  if (!user) return []
  if (Array.isArray(user.teacherTypes) && user.teacherTypes.length) {
    return user.teacherTypes
  }
  return user.teacherType ? [user.teacherType] : []
}

function hasTeacherType(user, teacherType) {
  return teacherTypesOf(user).includes(teacherType)
}

function currentTeacherType(user) {
  const types = teacherTypesOf(user)
  if (user?.teacherType && types.includes(user.teacherType)) {
    return user.teacherType
  }
  return types[0] || ''
}

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
  scrollBehavior() {
    return { top: 0 }
  },
})

useAuthStore().fetchUser()

router.beforeEach((to) => {
  const { isAuthenticated, user } = useAuthStore()
  const targetRole = routeRole(to.path)

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

  if (!isAuthenticated.value) {
    return targetRole ? loginPath(targetRole) : '/'
  }

  if (!user.value) {
    return true
  }

  if (targetRole && !hasTeacherType(user.value, targetRole)) {
    ElMessage.warning('当前账号未注册该教师身份，请先登录或注册该端身份')
    return loginPath(targetRole)
  }

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

createApp(App).use(router).use(ElementPlus).mount('#app')
