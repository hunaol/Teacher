<script setup>
import { RouterLink } from 'vue-router'
import { midApp } from '../mock/platformData'

const points = ['错题诊断', '数字助教', '课题研究导航']
</script>

<template>
  <div class="login-shell login-mid">
    <section class="login-layout-panel">
      <div class="login-side login-side-mid">
        <div class="login-side-top">
          <p class="page-eyebrow">骨干教师端</p>
          <span class="header-chip subtle">提升型工作流</span>
        </div>
        <h1>围绕课堂改进、互动支持和研究提升，形成更完整的教学闭环。</h1>
        <p>适合承担校本教研与课堂优化任务的教师，帮助分析学情、增强课堂互动并推进研究成果落地。</p>
        <div class="login-point-list">
          <span v-for="item in points" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ midApp.appName }}</p>
          <h2>{{ midApp.login.title }}</h2>
          <p class="login-subtitle">{{ midApp.login.subtitle }}</p>
          <div class="login-form-clean">
            <input :value="midApp.login.account" readonly />
            <input value="••••••••" readonly type="password" />
            <RouterLink class="login-button-clean" :to="midApp.login.enterPath">进入工作区</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
