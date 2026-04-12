import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
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
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

createApp(App).use(router).mount('#app')
