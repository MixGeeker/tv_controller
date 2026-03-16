<script setup lang="ts">
defineProps<{
  percent: number
  label?: string
}>()
</script>

<template>
  <div class="hud-progress">
    <div class="hud-progress__track">
      <div
        class="hud-progress__fill"
        :style="{ width: `${Math.min(100, Math.max(0, percent))}%` }"
      ></div>
      <div
        class="hud-progress__glow"
        :style="{ left: `${Math.min(100, Math.max(0, percent))}%` }"
      ></div>
    </div>
    <span v-if="label" class="hud-progress__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.hud-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hud-progress__track {
  position: relative;
  flex: 1;
  height: 6px;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid var(--border);
  overflow: visible;
}

.hud-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-deep), var(--accent));
  transition: width 0.4s ease;
  position: relative;
}

.hud-progress__glow {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 14px;
  background: var(--accent);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px var(--accent), 0 0 16px rgba(0, 212, 255, 0.3);
  transition: left 0.4s ease;
}

.hud-progress__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent);
  min-width: 40px;
  text-align: right;
}
</style>
