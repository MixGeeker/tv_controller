<script setup lang="ts">
import { ref } from 'vue'
import { provideController } from './composables/useController'
import { useBreakpoint } from './composables/useBreakpoint'

import StatusBar from './components/StatusBar.vue'
import DevicePanel from './components/DevicePanel.vue'
import MediaPanel from './components/MediaPanel.vue'
import SessionPanel from './components/SessionPanel.vue'
import LaunchPanel from './components/LaunchPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import MobileTabBar from './components/MobileTabBar.vue'

provideController()
const { isMobile } = useBreakpoint()
const mobileTab = ref('devices')
</script>

<template>
  <div class="shell">
    <StatusBar />

    <!-- Desktop / iPad: single-page grid -->
    <main v-if="!isMobile" class="grid-desktop">
      <div class="grid-desktop__left">
        <DevicePanel />
        <SessionPanel />
      </div>
      <div class="grid-desktop__center">
        <LaunchPanel />
        <ControlPanel />
      </div>
      <div class="grid-desktop__right">
        <MediaPanel />
      </div>
    </main>

    <!-- Mobile: tabbed -->
    <main v-else class="grid-mobile">
      <div v-if="mobileTab === 'devices'" class="mobile-page">
        <DevicePanel />
        <SessionPanel />
      </div>
      <div v-if="mobileTab === 'media'" class="mobile-page">
        <MediaPanel />
        <LaunchPanel />
      </div>
      <div v-if="mobileTab === 'control'" class="mobile-page">
        <ControlPanel />
      </div>
    </main>

    <MobileTabBar v-if="isMobile" :active="mobileTab" @select="mobileTab = $event" />
  </div>
</template>

<style scoped>
.shell {
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
}

/* ── Desktop 3-column layout ── */

.grid-desktop {
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 16px;
  align-items: stretch;
  flex: 1;
}

.grid-desktop__left,
.grid-desktop__center,
.grid-desktop__right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Make specific panels stretch vertically to fill space */
.grid-desktop__left > :last-child,
.grid-desktop__center > :last-child,
.grid-desktop__right > * {
  flex: 1;
}

/* Tablet (768–1200): 2 columns */
@media (min-width: 768px) and (max-width: 1200px) {
  .grid-desktop {
    grid-template-columns: 1fr 1fr;
  }
  .grid-desktop__right {
    grid-column: 1 / -1;
  }
}

/* ── Mobile tabbed layout ── */

.grid-mobile {
  padding-bottom: 72px;
  flex: 1;
}

.mobile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
