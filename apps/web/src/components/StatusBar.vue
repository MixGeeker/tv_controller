<script setup lang="ts">
import { ref } from 'vue'
import { useController } from '../composables/useController'
import HudButton from './ui/HudButton.vue'
import HudModal from './ui/HudModal.vue'

const {
  apiBaseUrl,
  health,
  loading,
  flashMessage,
  errorMessage,
  refreshEverything,
  loadSessions,
} = useController()

const showSettings = ref(false)
</script>

<template>
  <div class="top-controls">
    <div class="status-bar__controls">
      <div class="status-bar__actions">
        <HudButton variant="primary" :disabled="loading.health || loading.devices" @click="refreshEverything">
          {{ loading.health || loading.devices ? '刷新中...' : '刷新状态' }}
        </HudButton>
        <HudButton variant="ghost" :disabled="loading.sessions" @click="loadSessions">
          {{ loading.sessions ? '同步中...' : '刷新会话' }}
        </HudButton>
        <HudButton variant="ghost" @click="showSettings = true">
          <span style="font-size: 1.1rem; line-height: 1;">⚙</span>
        </HudButton>
      </div>
      
      <div class="status-bar__status-indicator">
        API: 
        <span v-if="health?.status === 'ok'" class="text-success">正常</span>
        <span v-else class="text-danger">断开</span>
      </div>
    </div>

    <Transition name="banner">
      <div v-if="flashMessage" class="status-bar__banner status-bar__banner--ok">
        {{ flashMessage }}
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="errorMessage" class="status-bar__banner status-bar__banner--err">
        {{ errorMessage }}
      </div>
    </Transition>
  </div>

  <!-- 设置模态框 -->
  <HudModal
    v-model:show="showSettings"
    kicker="SYSTEM CONFIG"
    title="系统设置"
  >
    <div class="settings-form">
      <div class="settings-group">
        <h3 class="settings-group__title">API 连接设置</h3>
        <label class="hud-field">
          <span>API 地址</span>
          <input v-model="apiBaseUrl" type="url" placeholder="http://192.168.x.x:3100" />
          <p class="field-hint">修改后请点击右上角「刷新状态」以应用新地址。</p>
        </label>
      </div>

      <div class="settings-group">
        <h3 class="settings-group__title">服务健康状态</h3>
        <div v-if="health" class="health-info">
          <div class="health-item">
            <span class="health-item__key">状态</span>
            <span class="health-item__val" :class="{ 'text-success': health.status === 'ok' }">{{ health.status }}</span>
          </div>
          <div class="health-item">
            <span class="health-item__key">媒体地址</span>
            <span class="health-item__val">{{ health.publicBaseUrl }}</span>
          </div>
          <div class="health-item">
            <span class="health-item__key">静态根</span>
            <span class="health-item__val">{{ health.mediaStaticRoot }}</span>
          </div>
        </div>
        <div v-else class="health-empty">
          暂无健康状态数据，请先刷新。
        </div>
      </div>
    </div>
    
    <template #footer>
      <HudButton variant="ghost" @click="showSettings = false">关闭</HudButton>
    </template>
  </HudModal>
</template>

<style scoped>
.top-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 4px;
}

.status-bar__controls {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-panel);
  padding: 8px 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  clip-path: polygon(
    var(--cut) 0, calc(100% - var(--cut)) 0,
    100% var(--cut), 100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%, var(--cut) 100%,
    0 calc(100% - var(--cut)), 0 var(--cut)
  );
}

@media (max-width: 767px) {
  .top-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .status-bar__controls {
    flex-wrap: wrap;
    justify-content: space-between;
  }
}

.status-bar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-bar__status-indicator {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-dim);
  font-weight: 500;
}

.status-bar__banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: var(--shadow-md);
}

.status-bar__banner--ok {
  background: var(--success-dim);
  border: 1px solid rgba(22, 163, 74, 0.2);
  color: var(--success);
}

.status-bar__banner--err {
  background: var(--danger-dim);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: var(--danger);
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* 模态框内的表单样式 */
.settings-form {
  display: grid;
  gap: 24px;
}

.settings-group {
  display: grid;
  gap: 12px;
}

.settings-group__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-bright);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin: 0;
}

.hud-field {
  display: grid;
  gap: 6px;
}

.hud-field span {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-dim);
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.health-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.health-item {
  display: grid;
  gap: 4px;
}

.health-item__key {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-dim);
}

.health-item__val {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-bright);
  word-break: break-all;
}

.health-empty {
  padding: 12px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>
