<script setup lang="ts">
import { useController } from '../composables/useController'
import HudPanel from './ui/HudPanel.vue'
import HudButton from './ui/HudButton.vue'
import HudProgress from './ui/HudProgress.vue'

const {
  activeSession,
  activeSeekSeconds,
  activeVolume,
  loading,
  progressPercent,
  formatSeconds,
  refreshActiveSession,
  handleControl,
} = useController()
</script>

<template>
  <HudPanel v-if="activeSession" kicker="CONTROL" :title="activeSession.deviceName">
    <template #headerRight>
      <HudButton variant="ghost" @click="refreshActiveSession">立即刷新</HudButton>
    </template>

    <div class="ctrl-meta">
      <div class="ctrl-meta__item">
        <span class="ctrl-meta__key">状态</span>
        <span class="ctrl-meta__val" :class="{
          'text-success': activeSession.state === 'playing',
          'text-warn': activeSession.state === 'paused',
          'text-danger': activeSession.state === 'error',
        }">{{ activeSession.state }}</span>
        <span class="ctrl-meta__sub">{{ activeSession.transportState || '—' }}</span>
      </div>
      <div class="ctrl-meta__item">
        <span class="ctrl-meta__key">进度</span>
        <span class="ctrl-meta__val">{{ formatSeconds(activeSession.position) }} / {{ formatSeconds(activeSession.duration) }}</span>
        <span class="ctrl-meta__sub">{{ progressPercent }}%</span>
      </div>
      <div class="ctrl-meta__item">
        <span class="ctrl-meta__key">音量</span>
        <span class="ctrl-meta__val">{{ activeSession.volume ?? 0 }}</span>
        <span class="ctrl-meta__sub ctrl-meta__sub--err">{{ activeSession.lastError || '无错误' }}</span>
      </div>
    </div>

    <HudProgress :percent="progressPercent" :label="`${progressPercent}%`" />

    <div class="ctrl-actions">
      <HudButton variant="primary" :disabled="loading.control" @click="handleControl('play')">播放</HudButton>
      <HudButton variant="warn" :disabled="loading.control" @click="handleControl('pause')">暂停</HudButton>
      <HudButton variant="danger" :disabled="loading.control" @click="handleControl('stop')">停止</HudButton>
    </div>

    <div class="ctrl-sliders">
      <div class="ctrl-slider">
        <label class="hud-field">
          <span>跳转到</span>
          <div class="range-row">
            <input
              v-model.number="activeSeekSeconds"
              type="range"
              min="0"
              :max="Math.max(activeSession.duration, 1)"
              step="1"
            />
            <span class="range-val">{{ formatSeconds(activeSeekSeconds) }}</span>
          </div>
        </label>
        <HudButton variant="ghost" :disabled="loading.control" @click="handleControl('seek', { position: activeSeekSeconds })">
          应用进度
        </HudButton>
      </div>

      <div class="ctrl-slider">
        <label class="hud-field">
          <span>目标音量</span>
          <div class="range-row">
            <input v-model.number="activeVolume" type="range" min="0" max="100" step="1" />
            <span class="range-val">{{ activeVolume }}</span>
          </div>
        </label>
        <HudButton variant="ghost" :disabled="loading.control" @click="handleControl('volume', { volume: activeVolume })">
          应用音量
        </HudButton>
      </div>
    </div>
  </HudPanel>

  <HudPanel v-else kicker="CONTROL" title="播放控制">
    <div class="ctrl-empty">
      选择一个会话以启用控制面板
    </div>
  </HudPanel>
</template>

<style scoped>
.ctrl-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

@media (max-width: 500px) {
  .ctrl-meta {
    grid-template-columns: 1fr;
  }
}

.ctrl-meta__item {
  padding: 10px;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid var(--border);
  display: grid;
  gap: 2px;
}

.ctrl-meta__key {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.ctrl-meta__val {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--text-bright);
  text-transform: uppercase;
}

.ctrl-meta__sub {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-dim);
}

.ctrl-meta__sub--err {
  color: var(--danger);
}

.ctrl-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ctrl-sliders {
  display: grid;
  gap: 10px;
}

@media (min-width: 600px) {
  .ctrl-sliders {
    grid-template-columns: 1fr 1fr;
  }
}

.ctrl-slider {
  display: grid;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 212, 255, 0.03);
  border: 1px solid var(--border);
}

.hud-field {
  display: grid;
  gap: 3px;
}

.hud-field span {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.range-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.range-row input {
  flex: 1;
}

.range-val {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent);
  min-width: 44px;
  text-align: right;
}

.ctrl-empty {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 16px 0;
  text-align: center;
}
</style>
