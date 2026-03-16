<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost' | 'danger' | 'warn'
  wide?: boolean
  disabled?: boolean
}>()

defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <button
    class="hud-btn"
    :class="[
      `hud-btn--${variant ?? 'ghost'}`,
      { 'hud-btn--wide': wide },
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.hud-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: all 0.2s ease;
  clip-path: polygon(
    6px 0, calc(100% - 6px) 0,
    100% 6px, 100% calc(100% - 6px),
    calc(100% - 6px) 100%, 6px 100%,
    0 calc(100% - 6px), 0 6px
  );
}

.hud-btn:hover:not(:disabled) {
  border-color: var(--border-bright);
  color: var(--text-bright);
}

.hud-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.hud-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hud-btn--primary {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.hud-btn--primary:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.35);
  box-shadow: var(--glow-accent);
  color: #fff;
}

.hud-btn--danger {
  background: var(--danger-dim);
  border-color: var(--danger);
  color: var(--danger);
}

.hud-btn--danger:hover:not(:disabled) {
  background: rgba(255, 59, 59, 0.25);
  color: #fff;
}

.hud-btn--warn {
  background: var(--warn-dim);
  border-color: var(--warn);
  color: var(--warn);
}

.hud-btn--warn:hover:not(:disabled) {
  background: rgba(255, 149, 0, 0.3);
  box-shadow: var(--glow-warn);
  color: #fff;
}

.hud-btn--ghost {
  border-color: var(--border);
  background: transparent;
}

.hud-btn--ghost:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.06);
  border-color: var(--border-bright);
}

.hud-btn--wide {
  width: 100%;
}
</style>
