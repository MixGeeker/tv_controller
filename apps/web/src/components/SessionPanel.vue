<script setup lang="ts">
import { useController } from '../composables/useController'
import HudPanel from './ui/HudPanel.vue'

const {
  sessions,
  activeSessionId,
  selectSession,
} = useController()

const stateColor = (state: string) => {
  switch (state) {
    case 'playing': return 'state--playing'
    case 'paused': return 'state--paused'
    case 'error': return 'state--error'
    case 'stopped': return 'state--stopped'
    default: return 'state--idle'
  }
}
</script>

<template>
  <HudPanel kicker="SESSIONS" title="当前播放">
    <div v-if="sessions.length === 0" class="session-empty">
      暂无播放会话
    </div>

    <div class="session-list">
      <button
        v-for="session in sessions"
        :key="session.sessionId"
        class="session-card"
        :class="{ 'session-card--selected': session.sessionId === activeSessionId }"
        @click="selectSession(session.sessionId)"
      >
        <div class="session-card__info">
          <strong>{{ session.deviceName }}</strong>
          <p>{{ session.media.title || session.media.url }}</p>
        </div>
        <span class="session-card__state" :class="stateColor(session.state)">
          {{ session.state }}
        </span>
      </button>
    </div>
  </HudPanel>
</template>

<style scoped>
.session-empty {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 8px 0;
}

.session-list {
  display: grid;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.session-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-bright);
}

.session-card--selected {
  background: var(--bg-card-selected);
  border-color: var(--accent);
}

.session-card__info {
  min-width: 0;
  flex: 1;
}

.session-card__info strong {
  font-size: 0.85rem;
  color: var(--text-bright);
  display: block;
}

.session-card__info p {
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__state {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border: 1px solid;
  flex-shrink: 0;
}

.state--playing {
  color: var(--success);
  border-color: rgba(0, 255, 136, 0.3);
  background: var(--success-dim);
}

.state--paused {
  color: var(--warn);
  border-color: rgba(255, 149, 0, 0.3);
  background: var(--warn-dim);
}

.state--error {
  color: var(--danger);
  border-color: rgba(255, 59, 59, 0.3);
  background: var(--danger-dim);
}

.state--stopped {
  color: var(--text-dim);
  border-color: var(--border);
}

.state--idle {
  color: var(--text-muted);
  border-color: var(--border);
}
</style>
