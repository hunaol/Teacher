<script setup>
import UiButton from './UiButton.vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: true },
})

const emit = defineEmits(['update:open'])

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="ui-dialog-overlay" @click.self="closeOnBackdrop && close()">
        <div class="ui-dialog-panel" :class="size === 'lg' ? 'ui-dialog-panel-lg' : 'ui-dialog-panel-md'" @click.stop>
          <div class="ui-dialog-header">
            <div>
              <h3 v-if="title">{{ title }}</h3>
              <p v-if="description">{{ description }}</p>
            </div>
            <UiButton variant="ghost" class="ui-dialog-close" @click="close">
              <X :size="18" />
            </UiButton>
          </div>
          <div class="ui-dialog-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="ui-dialog-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-dialog-overlay { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: rgba(0,0,0,.42); backdrop-filter: blur(4px); }
.ui-dialog-panel { width: 90vw; max-height: 80vh; overflow-y: auto; border-radius: var(--radius-xl); border: 1px solid var(--border-light); background: var(--surface); box-shadow: var(--shadow-xl); display: grid; gap: 20px; padding: 28px; }
.ui-dialog-panel-md { max-width: 560px; }
.ui-dialog-panel-lg { max-width: 800px; }
.ui-dialog-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.ui-dialog-header h3 { margin: 0; font-size: 1.2rem; }
.ui-dialog-header p { margin: 4px 0 0; color: var(--text-soft); font-size: .85rem; }
.ui-dialog-body { }
.ui-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 16px; border-top: 1px solid var(--border-light); }
.ui-dialog-close { min-width: 36px; min-height: 36px; padding: 6px; }

.dialog-enter-active { animation: dialogIn .25s ease-out; }
.dialog-leave-active { animation: dialogIn .2s ease-in reverse; }
@keyframes dialogIn { from { opacity: 0; transform: scale(.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
