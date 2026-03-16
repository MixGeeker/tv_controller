<script setup lang="ts">
defineProps<{
  active: string
}>()

defineEmits<{
  select: [tab: string]
}>()

const tabs = [
  { id: 'devices', label: '设备', icon: '◈' },
  { id: 'media', label: '媒体', icon: '◆' },
  { id: 'control', label: '控制', icon: '▣' },
]
</script>

<template>
  <nav class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-bar__item"
      :class="{ 'tab-bar__item--active': active === tab.id }"
      @click="$emit('select', tab.id)"
    >
      <span class="tab-bar__icon">{{ tab.icon }}</span>
      <span class="tab-bar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  background: var(--bg-panel-solid);
  border-top: 1px solid var(--border);
  padding: 4px 0;
  padding-bottom: env(safe-area-inset-bottom, 4px);
}

.tab-bar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  transition: color 0.2s;
}

.tab-bar__item--active {
  color: var(--accent);
}

.tab-bar__icon {
  font-size: 1.2rem;
  line-height: 1;
}

.tab-bar__label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tab-bar__item--active .tab-bar__label {
  color: var(--accent);
}
</style>
