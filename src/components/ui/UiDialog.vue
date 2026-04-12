<script setup>
import UiButton from './UiButton.vue'

defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:open'])

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ui-dialog-overlay" @click.self="close">
      <div class="ui-dialog-panel" :class="size === 'lg' ? 'ui-dialog-panel-lg' : 'ui-dialog-panel-md'">
        <div class="ui-dialog-header">
          <div>
            <h3 v-if="title">{{ title }}</h3>
            <p v-if="description">{{ description }}</p>
          </div>
          <UiButton variant="ghost" class="ui-dialog-close" @click="close">关闭</UiButton>
        </div>

        <div class="ui-dialog-body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="ui-dialog-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-dialog-overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 24px; background: rgba(18,30,47,.42); backdrop-filter: blur(10px); }
.ui-dialog-panel { width: min(100%, 760px); max-height: min(88vh, 920px); overflow: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,.3); background: rgba(252,253,255,.98); box-shadow: 0 30px 80px rgba(20,39,60,.22); }
.ui-dialog-panel-md { max-width: 720px; }
.ui-dialog-panel-lg { max-width: 980px; }
.ui-dialog-header, .ui-dialog-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 22px; }
.ui-dialog-header { border-bottom: 1px solid rgba(125,147,171,.18); }
.ui-dialog-footer { justify-content: flex-end; border-top: 1px solid rgba(125,147,171,.18); }
.ui-dialog-body { padding: 22px; }
.ui-dialog-header h3 { margin: 0; font-size: 1.2rem; }
.ui-dialog-header p { margin: 6px 0 0; color: var(--text-soft); }
.ui-dialog-close { min-width: 72px; }
</style>
