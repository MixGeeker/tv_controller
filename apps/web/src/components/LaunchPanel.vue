<script setup lang="ts">
import { useController } from '../composables/useController'
import HudPanel from './ui/HudPanel.vue'
import HudButton from './ui/HudButton.vue'

const {
  selectedDevices,
  selectedMedia,
  loading,
  launchForm,
  syncModeLabel,
  handleLaunch,
} = useController()
</script>

<template>
  <HudPanel kicker="LAUNCH" title="发起任务" accent="amber">
    <div class="launch-summary">
      <div class="launch-block">
        <span class="launch-block__label">目标设备</span>
        <strong class="launch-block__val">{{ selectedDevices.length }}</strong>
        <p class="launch-block__detail">
          {{ selectedDevices.map((d) => d.friendlyName).join('、') || '尚未选择设备' }}
        </p>
      </div>
      <div class="launch-block">
        <span class="launch-block__label">当前媒体</span>
        <strong class="launch-block__val">{{ selectedMedia?.title || '尚未选择' }}</strong>
        <p class="launch-block__detail">{{ selectedMedia?.url || '请先上传文件或登记 URL' }}</p>
      </div>
    </div>

    <div class="launch-config">
      <label class="hud-field">
        <span>启动方式</span>
        <select v-model="launchForm.autoplay">
          <option :value="true">加载后立即播放</option>
          <option :value="false">只加载不播放</option>
        </select>
      </label>
      <label class="hud-field">
        <span>起始秒数</span>
        <input v-model.number="launchForm.startPosition" type="number" min="0" step="1" />
      </label>
      <label class="hud-field">
        <span>初始音量</span>
        <div class="range-row">
          <input v-model.number="launchForm.volume" type="range" min="0" max="100" step="1" />
          <span class="range-val">{{ launchForm.volume }}</span>
        </div>
      </label>
    </div>

    <HudButton variant="warn" :disabled="loading.launch" wide @click="handleLaunch">
      {{ loading.launch ? '发送中...' : `开始${syncModeLabel}` }}
    </HudButton>
  </HudPanel>
</template>

<style scoped>
.launch-summary {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 500px) {
  .launch-summary {
    grid-template-columns: 1fr;
  }
}

.launch-block {
  padding: 10px;
  background: rgba(255, 149, 0, 0.04);
  border: 1px solid var(--border-warn);
}

.launch-block__label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--warn);
}

.launch-block__val {
  display: block;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-bright);
  margin-top: 4px;
}

.launch-block__detail {
  font-size: 0.72rem;
  color: var(--text-dim);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.launch-config {
  display: grid;
  gap: 8px;
}

@media (min-width: 500px) {
  .launch-config {
    grid-template-columns: 1fr 1fr 1fr;
  }
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
  color: var(--warn);
  min-width: 28px;
  text-align: right;
}
</style>
