<script setup>
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <Transition name="page-fade" mode="out-in">
      <div :key="route.path" class="page-transition-wrapper">
        <component :is="Component" />
      </div>
    </Transition>
  </router-view>
</template>
