<script setup>
import { RouterLink } from 'vue-router'
import { homeIntro, roleCards } from '../mock/platformData'
import { iconify, visuals } from '../mock/visualAssets'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'

const roleMeta = {
  senior: { title: '资深教师', note: '沉淀教案与课堂反思', art: visuals.seniorPhoto, icon: iconify.senior },
  mid: { title: '骨干教师', note: '诊断课堂与推进研究', art: visuals.midPhoto, icon: iconify.mid },
  novice: { title: '新任教师', note: '学习经验与记录成长', art: visuals.novicePhoto, icon: iconify.novice },
}
</script>

<template>
  <div class="home-shell product-home">
    <header class="home-header product-home-header">
      <div class="home-brand">
        <div class="brand-mark">乡</div>
        <div>
          <strong>乡村教师智能助手</strong>
          <p>按教师发展阶段提供对应工作入口</p>
        </div>
      </div>
      <UiBadge>教学支持平台</UiBadge>
    </header>

    <section class="product-home-hero">
      <div class="product-home-copy">
        <UiBadge class="hero-badge">乡村教师工作入口</UiBadge>
        <h1>{{ homeIntro.title }}</h1>
        <p>{{ homeIntro.subtitle }}</p>
        <div class="product-home-metrics">
          <UiCard class="metric-card"><strong>3</strong><span>角色入口</span></UiCard>
          <UiCard class="metric-card"><strong>7</strong><span>核心功能</span></UiCard>
          <UiCard class="metric-card"><strong>1</strong><span>统一平台</span></UiCard>
        </div>
      </div>
      <UiCard class="product-home-hero-card">
        <img :src="visuals.homeHero" alt="乡村教学场景" class="product-hero-image" />
        <div class="hero-card-copy">
          <strong>从适合你的角色开始</strong>
          <p>选择身份后，直接进入与你教学任务最相关的功能区。</p>
        </div>
      </UiCard>
    </section>

    <section class="product-role-grid">
      <RouterLink
        v-for="item in roleCards"
        :key="item.key"
        :to="item.entry"
        class="role-product-link"
      >
        <UiCard class="product-role-card" :class="`product-role-${item.key}`">
          <div class="product-role-media">
            <img :src="roleMeta[item.key].art" :alt="item.name" class="product-role-photo" />
            <div class="role-icon-wrap">
              <img :src="roleMeta[item.key].icon" :alt="roleMeta[item.key].title" class="role-icon-img" />
            </div>
          </div>
          <div class="product-role-copy">
            <UiBadge>{{ roleMeta[item.key].title }}</UiBadge>
            <h2>{{ item.name }}</h2>
            <p>{{ item.description }}</p>
            <strong>{{ roleMeta[item.key].note }}</strong>
          </div>
        </UiCard>
      </RouterLink>
    </section>
  </div>
</template>
