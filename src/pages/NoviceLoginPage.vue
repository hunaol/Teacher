<script setup>
import { RouterLink } from 'vue-router'
import { noviceApp } from '../mock/platformData'

const points = ['名师经验库', '在线答疑', '成长档案袋']
</script>

<template>
  <div class="login-shell login-novice">
    <section class="login-layout-panel">
      <div class="login-side login-side-novice">
        <div class="login-side-top">
          <p class="page-eyebrow">新任教师端</p>
          <span class="header-chip subtle">启航型工作流</span>
        </div>
        <h1>帮助新教师更快建立稳定、清晰、可复制的课堂方法。</h1>
        <p>围绕经验学习、在线提问和成长记录，减少新任教师进入课堂后的试错成本，提升上手效率。</p>
        <div class="login-point-list">
          <span v-for="item in points" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ noviceApp.appName }}</p>
          <h2>{{ noviceApp.login.title }}</h2>
          <p class="login-subtitle">{{ noviceApp.login.subtitle }}</p>
          <div class="login-form-clean">
            <input :value="noviceApp.login.account" readonly />
            <input value="••••••••" readonly type="password" />
            <RouterLink class="login-button-clean" :to="noviceApp.login.enterPath">进入工作区</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
