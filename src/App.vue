<!--
  App.vue — 应用根组件
  ====================================================
  作为 Vue Router 的容器，仅负责挂载匹配的路由页面，
  实际布局、导航与业务逻辑由各 page 与 SoloAppShell 完成。
-->
<script setup>
</script>

<template>
  <!-- 路由出口：所有页面均在此处切换 -->
  <router-view />
</template>
