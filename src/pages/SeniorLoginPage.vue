<script setup>
import { RouterLink } from 'vue-router'
import { seniorApp } from '../mock/platformData'

const points = ['智能语音备课', '随堂反思', '案例沉淀']
</script>

<template>
  <div class="login-shell login-senior">
    <section class="login-layout-panel">
      <div class="login-side login-side-senior">
        <div class="login-side-top">
          <p class="page-eyebrow">资深教师端</p>
          <span class="header-chip subtle">经验型工作流</span>
        </div>
        <h1>把课堂经验沉淀成可复用的教案与教学记录。</h1>
        <p>面向长期扎根乡村课堂的教师，支持语音备课、课堂反思和案例积累，帮助经验持续转化。</p>
        <div class="login-point-list">
          <span v-for="item in points" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <div class="login-card-head">
            <p class="login-brand">{{ seniorApp.appName }}</p>
            <span class="login-state-dot"></span>
          </div>
          <h2>{{ seniorApp.login.title }}</h2>
          <p class="login-subtitle">{{ seniorApp.login.subtitle }}</p>
          <div class="login-form-clean">
            <label class="field-label">账号</label>
            <input :value="seniorApp.login.account" readonly />
            <label class="field-label">密码</label>
            <input value="••••••••" readonly type="password" />
            <RouterLink class="login-button-clean" :to="seniorApp.login.enterPath">进入工作区</RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
