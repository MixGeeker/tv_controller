<script setup lang="ts">
import { useController } from '../composables/useController'
import HudPanel from './ui/HudPanel.vue'
import HudButton from './ui/HudButton.vue'

const {
  devices,
  selectedDeviceIds,
  loading,
  syncModeLabel,
  showDeviceHint,
  loadDevices,
  toggleDevice,
} = useController()
</script>

<template>
  <HudPanel kicker="DEVICES" title="扫描结果">
    <template #headerRight>
      <HudButton variant="ghost" :disabled="loading.devices" @click="loadDevices">
        {{ loading.devices ? '扫描中...' : '重新扫描' }}
      </HudButton>
    </template>

    <div class="device-mode">
      <span class="device-mode__dot"></span>
      当前模式：<strong>{{ syncModeLabel }}</strong>
    </div>

    <div v-if="showDeviceHint" class="device-hint">
      未发现设备。请确认电视与电脑在同一网段，并检查
      <code>apps/api/.env</code> 中的 <code>NETWORK_INTERFACE</code> 配置。
    </div>

    <div class="device-list">
      <label
        v-for="device in devices"
        :key="device.id"
        class="device-card"
        :class="{ 'device-card--selected': selectedDeviceIds.includes(device.id) }"
      >
        <input
          :checked="selectedDeviceIds.includes(device.id)"
          type="checkbox"
          @change="toggleDevice(device.id)"
        />
        <div class="device-card__info">
          <strong>{{ device.friendlyName }}</strong>
          <p>{{ device.manufacturer || '未知厂商' }} · {{ device.modelName || '未知型号' }}</p>
          <div class="device-card__caps">
            <span :class="device.capabilities.canSeek ? 'cap--ok' : 'cap--no'">SEEK</span>
            <span :class="device.capabilities.canSetVolume ? 'cap--ok' : 'cap--no'">VOL</span>
          </div>
        </div>
      </label>
    </div>
  </HudPanel>
</template>

<style scoped>
.device-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-dim);
}

.device-mode strong {
  color: var(--accent);
  font-family: var(--font-mono);
}

.device-mode__dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--accent);
  animation: pulse 2s ease infinite;
}

.device-hint {
  padding: 10px;
  background: var(--warn-dim);
  border: 1px solid var(--border-warn);
  font-size: 0.82rem;
  color: var(--warn);
}

.device-hint code {
  font-family: var(--font-mono);
  color: var(--text-bright);
}

.device-list {
  display: grid;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.device-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.device-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-bright);
}

.device-card--selected {
  background: var(--bg-card-selected);
  border-color: var(--accent);
  box-shadow: inset 0 0 12px rgba(0, 212, 255, 0.06);
}

.device-card__info {
  min-width: 0;
}

.device-card__info strong {
  font-size: 0.88rem;
  color: var(--text-bright);
}

.device-card__info p {
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.device-card__caps {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.device-card__caps span {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  border: 1px solid;
}

.cap--ok {
  color: var(--success);
  border-color: rgba(0, 255, 136, 0.3);
  background: var(--success-dim);
}

.cap--no {
  color: var(--text-muted);
  border-color: var(--border);
  background: transparent;
}
</style>
