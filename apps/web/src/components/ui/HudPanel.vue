<script setup lang="ts">
defineProps<{
  title?: string
  kicker?: string
  accent?: 'cyan' | 'amber'
}>()
</script>

<template>
  <section class="hud-panel" :class="[`hud-panel--${accent ?? 'cyan'}`]">
    <div class="hud-panel__corner hud-panel__corner--tl"></div>
    <div class="hud-panel__corner hud-panel__corner--tr"></div>
    <div class="hud-panel__corner hud-panel__corner--bl"></div>
    <div class="hud-panel__corner hud-panel__corner--br"></div>

    <div v-if="kicker || title || $slots.headerRight" class="hud-panel__head">
      <div class="hud-panel__titles">
        <span v-if="kicker" class="hud-panel__kicker">{{ kicker }}</span>
        <h2 v-if="title" class="hud-panel__title">{{ title }}</h2>
      </div>
      <div v-if="$slots.headerRight" class="hud-panel__actions">
        <slot name="headerRight" />
      </div>
    </div>

    <div class="hud-panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.hud-panel {
  position: relative;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  padding: 16px;
  clip-path: polygon(
    var(--cut) 0, calc(100% - var(--cut)) 0,
    100% var(--cut), 100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%, var(--cut) 100%,
    0 calc(100% - var(--cut)), 0 var(--cut)
  );
  animation: fadeIn 0.35s ease both;
  display: flex;
  flex-direction: column;
}

.hud-panel--cyan {
  border-color: var(--border);
}

.hud-panel--amber {
  border-color: var(--border-warn);
}

.hud-panel__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}

.hud-panel--cyan .hud-panel__corner { border-color: var(--accent); }
.hud-panel--amber .hud-panel__corner { border-color: var(--warn); }

.hud-panel__corner--tl {
  top: -1px; left: -1px;
  border-top: 2px solid;
  border-left: 2px solid;
}
.hud-panel__corner--tr {
  top: -1px; right: -1px;
  border-top: 2px solid;
  border-right: 2px solid;
}
.hud-panel__corner--bl {
  bottom: -1px; left: -1px;
  border-bottom: 2px solid;
  border-left: 2px solid;
}
.hud-panel__corner--br {
  bottom: -1px; right: -1px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}

.hud-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.hud-panel__kicker {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 4px;
  display: block;
}

.hud-panel__title {
  font-family: var(--font-body);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-bright);
  margin: 0;
}

.hud-panel__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.hud-panel__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
</style>
