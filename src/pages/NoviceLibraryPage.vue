<script setup>
import { computed, ref } from 'vue'
import { Bookmark, BookmarkCheck, CirclePlay, Filter, GraduationCap, MessagesSquare } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiTabs from '../components/ui/UiTabs.vue'
import { noviceApp } from '../mock/platformData'

const videos = ref(noviceApp.library.videos.map((item) => ({ ...item })))
const category = ref('课堂管理')
const activeTab = ref('all')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '已收藏', value: 'fav' },
  { label: '当前分类', value: 'category' },
]

const filteredVideos = computed(() => {
  if (activeTab.value === 'fav') return videos.value.filter((item) => item.favorite)
  if (activeTab.value === 'category') {
    return videos.value.filter((item) => item.tags.some((tag) => {
      if (category.value === '课堂管理') return tag.includes('课堂') || tag.includes('规则')
      if (category.value === '提问设计') return tag.includes('提问') || tag.includes('表达')
      return tag.includes('活动') || tag.includes('合作')
    }))
  }
  return videos.value
})

function toggleFavorite(item) {
  item.favorite = !item.favorite
}
</script>

<template>
  <SoloAppShell :app-name="noviceApp.appName" :title="noviceApp.library.title" :subtitle="noviceApp.library.subtitle" :stats="noviceApp.library.stats" :nav-items="noviceApp.navItems" :theme="noviceApp.theme">
    <section class="feature-screen novice-learning-board">
      <div class="task-summary">
        <div>
          <p class="hero-kicker">名师经验学习</p>
          <h3>{{ category }} · 经验视频与课堂技巧</h3>
        </div>
        <span class="status-pill"><MessagesSquare :size="14" /> 先看经验再提问</span>
      </div>

      <div class="novice-library-layout">
        <div class="visual-card novice-featured-card">
          <img src="https://picsum.photos/seed/rural-class-video/1200/900" alt="教学场景" class="hero-image" />
          <div>
            <div class="mentor-spotlight">
              <div class="mentor-avatar"><GraduationCap :size="18" /></div>
              <div>
                <strong>推荐主题：{{ category }}</strong>
                <p>{{ filteredVideos.length }} 条可直接参考的课堂经验，适合新教师快速借鉴并用于当前教学情境。</p>
              </div>
            </div>
            <div class="featured-tags">
              <span>可收藏</span>
              <span>可筛选</span>
              <span>可迁移到课堂</span>
            </div>
          </div>
        </div>

        <div class="visual-card novice-community-card">
          <p class="hero-kicker">今日学习路线</p>
          <h3>先看一条经验，再带着问题进入答疑区</h3>
          <div class="choice-bar">
            <button class="choice-btn" @click="category = '课堂管理'">课堂管理</button>
            <button class="choice-btn" @click="category = '提问设计'">提问设计</button>
            <button class="choice-btn" @click="category = '活动组织'">活动组织</button>
          </div>
          <UiTabs v-model="activeTab" :items="tabs" />
        </div>
      </div>

      <div class="novice-video-grid">
        <article v-for="item in filteredVideos" :key="item.id" class="data-card novice-video-card">
          <div class="video-thumb"><CirclePlay :size="18" /> {{ item.duration }}</div>
          <div class="novice-video-copy">
            <strong>{{ item.title }}</strong>
            <p>{{ item.teacher }}</p>
            <div class="novice-video-meta">
              <span v-for="tag in item.tags" :key="tag" class="timeline-role"><Filter :size="12" /> {{ tag }}</span>
            </div>
          </div>
          <UiButton variant="ghost" @click="toggleFavorite(item)">
            <BookmarkCheck v-if="item.favorite" :size="16" />
            <Bookmark v-else :size="16" />
            {{ item.favorite ? '已收藏' : '收藏' }}
          </UiButton>
        </article>
      </div>
    </section>
  </SoloAppShell>
</template>
