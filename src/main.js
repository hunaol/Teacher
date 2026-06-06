import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'
import HomePage from './pages/HomePage.vue'
import SeniorLoginPage from './pages/SeniorLoginPage.vue'
import SeniorLessonPage from './pages/SeniorLessonPage.vue'
import SeniorReflectionPage from './pages/SeniorReflectionPage.vue'
import MidLoginPage from './pages/MidLoginPage.vue'
import MidDiagnosisPage from './pages/MidDiagnosisPage.vue'
import MidAvatarPage from './pages/MidAvatarPage.vue'
import MidResearchPage from './pages/MidResearchPage.vue'
import NoviceLoginPage from './pages/NoviceLoginPage.vue'
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

function loginPath(prefix) {
  return `/${prefix}/login`
}

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

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/choose', name: 'choose', component: HomePage },
    { path: '/senior', redirect: '/senior/login' },
    { path: '/senior/login', component: SeniorLoginPage },
    { path: '/senior/lesson', component: SeniorLessonPage },
    { path: '/senior/reflection', component: SeniorReflectionPage },
    { path: '/mid', redirect: '/mid/login' },
    { path: '/mid/login', component: MidLoginPage },
    { path: '/mid/diagnosis', component: MidDiagnosisPage },
    { path: '/mid/avatar', component: MidAvatarPage },
    { path: '/mid/research', component: MidResearchPage },
    { path: '/novice', redirect: '/novice/login' },
    { path: '/novice/login', component: NoviceLoginPage },
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

  if (PUBLIC_PATHS.includes(to.path)) {
    if (isAuthenticated.value && to.path.includes('/login')) {
      const role = user.value?.teacherType
      if (role && ROLE_HOME[role]) {
        return ROLE_HOME[role]
      }
      return '/'
    }
    return true
  }

  if (!isAuthenticated.value) {
    const prefix = to.path.split('/')[1]
    const target = ROLE_HOME[prefix]
    return target ? loginPath(prefix) : '/'
  }

  const role = user.value?.teacherType
  if (role) {
    const prefix = to.path.split('/')[1]
    if (ROLE_ROUTES[role] && !ROLE_ROUTES[role].includes(to.path)) {
      const otherRole = Object.keys(ROLE_ROUTES).find(
        (r) => r !== role && ROLE_ROUTES[r].includes(to.path),
      )
      if (otherRole) {
        ElMessage.warning('您没有权限访问该页面，已返回首页')
        return ROLE_HOME[role]
      }
    }
  }

  return true
})

createApp(App).use(router).use(ElementPlus).mount('#app')
