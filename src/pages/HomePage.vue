<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, Bot, Compass, GraduationCap, Mic, School } from 'lucide-vue-next'
import { roleCards } from '../mock/platformData'

const heroScenery = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80'

const roleMeta = {
  senior: {
    title: '老教师端',
    icon: Mic,
    scene: '沉淀经验，持续迭代教案与反思',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    routeHint: '适合有长期教学经验、重视经验沉淀的教师',
  },
  mid: {
    title: '中年教师端',
    icon: Bot,
    scene: '课堂诊断、互动优化、课题研究一体推进',
    image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
    routeHint: '适合承担教研任务、关注课堂改进的骨干教师',
  },
  novice: {
    title: '新任教师端',
    icon: GraduationCap,
    scene: '先学经验，再提问，最后形成成长档案',
    image: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80',
    routeHint: '适合新上岗教师，快速建立稳定课堂方法',
  },
}
</script>

<template>
  <div class="home-shell ysd-ref-home">
    <header class="ysd-ref-nav">
      <RouterLink to="/" class="ysd-ref-brand">
        <span class="ysd-ref-brand-icon"><School :size="18" /></span>
        <strong>云师道</strong>
      </RouterLink>

      <nav class="ysd-ref-menu" aria-label="首页导航">
        <a href="#senior">老教师端</a>
        <a href="#mid">中年教师端</a>
        <a href="#novice">新任教师端</a>
      </nav>

      <button class="ysd-ref-login">登录/注册</button>
    </header>

    <section class="ysd-ref-hero">
      <div class="ysd-ref-hero-copy">
        <p class="ysd-ref-kicker">乡村教育智能代理平台</p>
        <h1>云师道——<span>数智化助力乡村教育先行者</span></h1>
        <p>
          请先选择你的教师身份入口。系统会按你当前教学阶段提供最匹配的功能流程，避免进入后无效操作。
        </p>

        <div class="ysd-ref-actions">
          <a href="#choose" class="ysd-ref-btn ysd-ref-btn-primary">现在选择教师端</a>
          <a href="#novice" class="ysd-ref-btn ysd-ref-btn-secondary">先看新任教师端</a>
        </div>

        <div class="ysd-ref-guide">
          <article>
            <span>01</span>
            <p>先确认自己属于哪个教师发展阶段</p>
          </article>
          <article>
            <span>02</span>
            <p>点击对应端口进入专属工作流</p>
          </article>
          <article>
            <span>03</span>
            <p>在端内按步骤完成本次教学任务</p>
          </article>
        </div>
      </div>

      <div class="ysd-ref-hero-media">
        <img :src="heroScenery" alt="乡村田野风光" />
        <div class="ysd-ref-hero-tag">
          <Compass :size="15" />
          <span>先选端口，再开始使用</span>
        </div>
      </div>
    </section>

    <section id="choose" class="ysd-ref-choose">
      <div class="ysd-ref-choose-head">
        <h2>请选择对应教师端</h2>
        <p>下面三个入口互斥使用：每次只需进入与你当前角色匹配的一个端口。</p>
      </div>

      <div class="ysd-ref-role-grid">
        <RouterLink
          v-for="item in roleCards"
          :id="item.key"
          :key="item.key"
          :to="item.entry"
          class="ysd-ref-role-card"
        >
          <img :src="roleMeta[item.key].image" :alt="roleMeta[item.key].title" class="ysd-ref-role-cover" />
          <div class="ysd-ref-role-body">
            <div class="ysd-ref-role-top">
              <span class="ysd-ref-role-icon"><component :is="roleMeta[item.key].icon" :size="16" /></span>
              <strong>{{ roleMeta[item.key].title }}</strong>
            </div>
            <p>{{ roleMeta[item.key].scene }}</p>
            <small>{{ roleMeta[item.key].routeHint }}</small>
            <span class="ysd-ref-enter">进入该端口 <ArrowRight :size="14" /></span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
