<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  kicker?: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
}>()

const close = () => {
  emit('update:show', false)
  emit('close')
}

// 按 ESC 键关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 锁定背景滚动
watch(() => props.show, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="hud-modal-overlay" @click="close">
        <div class="hud-modal-wrapper">
          <div class="hud-modal-container" @click.stop>
            <!-- 装饰角 -->
            <div class="modal-corner modal-corner--tl"></div>
            <div class="modal-corner modal-corner--tr"></div>
            <div class="modal-corner modal-corner--bl"></div>
            <div class="modal-corner modal-corner--br"></div>

            <div class="hud-modal-header">
              <div>
                <span v-if="kicker" class="hud-modal-kicker">{{ kicker }}</span>
                <h2 class="hud-modal-title">{{ title }}</h2>
              </div>
              <button class="hud-modal-close" @click="close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="hud-modal-body">
              <slot />
            </div>
            
            <div v-if="$slots.footer" class="hud-modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hud-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(6, 10, 20, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.hud-modal-wrapper {
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

.hud-modal-container {
  position: relative;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-bright);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 212, 255, 0.05);
  clip-path: polygon(
    16px 0, calc(100% - 16px) 0,
    100% 16px, 100% calc(100% - 16px),
    calc(100% - 16px) 100%, 16px 100%,
    0 calc(100% - 16px), 0 16px
  );
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.modal-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: var(--accent);
  pointer-events: none;
  z-index: 2;
}

.modal-corner--tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
.modal-corner--tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
.modal-corner--bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
.modal-corner--br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }

.hud-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(to bottom, rgba(0, 212, 255, 0.08), transparent);
  flex-shrink: 0;
}

.hud-modal-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  display: block;
  margin-bottom: 4px;
}

.hud-modal-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.04em;
  margin: 0;
}

.hud-modal-close {
  background: transparent;
  border: none;
  color: var(--text-dim);
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hud-modal-close:hover {
  color: var(--accent);
  transform: scale(1.1);
}

.hud-modal-body {
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.hud-modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .hud-modal-container,
.modal-fade-leave-to .hud-modal-container {
  transform: scale(0.95) translateY(10px);
}
</style>
