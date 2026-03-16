<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import {
  controlSession,
  createPlaybackSession,
  fetchDevices,
  fetchHealth,
  fetchMediaLibrary,
  fetchSession,
  fetchSessions,
  registerUrlMedia,
  startSynchronizedPlayback,
  uploadMediaFile,
} from './api'
import type { DeviceSummary, HealthInfo, MediaRecord, SessionInfo } from './types'

const apiBaseUrl = ref(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100')
const health = ref<HealthInfo | null>(null)
const devices = ref<DeviceSummary[]>([])
const mediaLibrary = ref<MediaRecord[]>([])
const sessions = ref<SessionInfo[]>([])
const selectedDeviceIds = ref<string[]>([])
const selectedMediaId = ref('')
const activeSessionId = ref('')
const activeSeekSeconds = ref(0)
const activeVolume = ref(20)
const flashMessage = ref('')
const errorMessage = ref('')
const uploadFile = ref<File | null>(null)

const loading = reactive({
  health: false,
  devices: false,
  media: false,
  upload: false,
  register: false,
  launch: false,
  sessions: false,
  control: false,
})

const uploadForm = reactive({
  title: '',
  type: 'video' as 'video' | 'image',
})

const urlForm = reactive({
  url: '',
  contentType: 'video/mp4',
  type: 'video' as 'video' | 'image',
  title: '',
  thumbnailUrl: '',
})

const launchForm = reactive({
  autoplay: true,
  startPosition: 0,
  volume: 20,
})

let refreshTimer: ReturnType<typeof setInterval> | undefined

const selectedMedia = computed(() => mediaLibrary.value.find((item) => item.id === selectedMediaId.value) ?? null)
const activeSession = computed(() => sessions.value.find((item) => item.sessionId === activeSessionId.value) ?? null)
const selectedDevices = computed(() =>
  devices.value.filter((device) => selectedDeviceIds.value.includes(device.id)),
)
const mediaCountLabel = computed(() => `${mediaLibrary.value.length} 个媒体`)
const syncModeLabel = computed(() =>
  selectedDeviceIds.value.length > 1 ? '多设备软同步' : '单设备播放',
)
const progressPercent = computed(() => {
  if (!activeSession.value || activeSession.value.duration <= 0) {
    return 0
  }

  return Math.min(100, Math.round((activeSession.value.position / activeSession.value.duration) * 100))
})
const showDeviceHint = computed(() => !loading.devices && devices.value.length === 0)

const updateFlash = (message: string) => {
  flashMessage.value = message
  errorMessage.value = ''
}

const updateError = (message: string) => {
  errorMessage.value = message
  flashMessage.value = ''
}

const sortSessions = (items: SessionInfo[]) =>
  [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

const withTask = async (key: keyof typeof loading, action: () => Promise<void>) => {
  loading[key] = true

  try {
    await action()
  } catch (error) {
    updateError(error instanceof Error ? error.message : '请求失败')
  } finally {
    loading[key] = false
  }
}

const mergeSession = (session: SessionInfo) => {
  const existingIndex = sessions.value.findIndex((item) => item.sessionId === session.sessionId)
  if (existingIndex === -1) {
    sessions.value = sortSessions([session, ...sessions.value])
    return
  }

  const next = [...sessions.value]
  next.splice(existingIndex, 1, session)
  sessions.value = sortSessions(next)
}

const formatSeconds = (value = 0) => {
  const total = Math.max(0, Math.floor(value))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((unit) => unit.toString().padStart(2, '0')).join(':')
  }

  return [minutes, seconds].map((unit) => unit.toString().padStart(2, '0')).join(':')
}

const formatDate = (value: string) => new Date(value).toLocaleString()

const toggleDevice = (deviceId: string) => {
  selectedDeviceIds.value = selectedDeviceIds.value.includes(deviceId)
    ? selectedDeviceIds.value.filter((item) => item !== deviceId)
    : [...selectedDeviceIds.value, deviceId]
}

const selectSession = (sessionId: string) => {
  activeSessionId.value = sessionId
}

const loadHealth = async () => {
  await withTask('health', async () => {
    health.value = await fetchHealth(apiBaseUrl.value)
  })
}

const loadDevices = async () => {
  await withTask('devices', async () => {
    devices.value = await fetchDevices(apiBaseUrl.value)
    selectedDeviceIds.value = selectedDeviceIds.value.filter((deviceId) =>
      devices.value.some((device) => device.id === deviceId),
    )
  })
}

const loadMedia = async () => {
  await withTask('media', async () => {
    mediaLibrary.value = await fetchMediaLibrary(apiBaseUrl.value)
    if (!selectedMediaId.value && mediaLibrary.value[0]) {
      selectedMediaId.value = mediaLibrary.value[0].id
    }
  })
}

const loadSessions = async () => {
  await withTask('sessions', async () => {
    sessions.value = sortSessions(await fetchSessions(apiBaseUrl.value))
    if (!activeSessionId.value && sessions.value[0]) {
      activeSessionId.value = sessions.value[0].sessionId
    }
  })
}

const refreshActiveSession = async () => {
  if (!activeSessionId.value) {
    return
  }

  try {
    mergeSession(await fetchSession(apiBaseUrl.value, activeSessionId.value))
  } catch (error) {
    updateError(error instanceof Error ? error.message : '刷新会话失败')
  }
}

const refreshEverything = async () => {
  await Promise.all([loadHealth(), loadDevices(), loadMedia(), loadSessions()])
}

const onUploadSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  uploadFile.value = input.files?.[0] ?? null
}

const handleUpload = async () => {
  const file = uploadFile.value

  if (!file) {
    updateError('请先选择一个 mp4 或图片文件。')
    return
  }

  await withTask('upload', async () => {
    const record = await uploadMediaFile(apiBaseUrl.value, file, {
      title: uploadForm.title || undefined,
      type: uploadForm.type,
    })

    mediaLibrary.value = [record, ...mediaLibrary.value.filter((item) => item.id !== record.id)]
    selectedMediaId.value = record.id
    uploadFile.value = null
    uploadForm.title = ''
    updateFlash(`已上传：${record.title ?? record.id}`)
  })
}

const handleRegisterUrl = async () => {
  await withTask('register', async () => {
    const record = await registerUrlMedia(apiBaseUrl.value, {
      url: urlForm.url,
      contentType: urlForm.contentType,
      type: urlForm.type,
      title: urlForm.title || undefined,
      thumbnailUrl: urlForm.thumbnailUrl || undefined,
    })

    mediaLibrary.value = [record, ...mediaLibrary.value.filter((item) => item.id !== record.id)]
    selectedMediaId.value = record.id
    urlForm.url = ''
    urlForm.title = ''
    urlForm.thumbnailUrl = ''
    updateFlash(`已登记媒体：${record.title ?? record.id}`)
  })
}

const handleLaunch = async () => {
  const media = selectedMedia.value

  if (!media) {
    updateError('请先在媒体库中选择一个资源。')
    return
  }

  if (selectedDeviceIds.value.length === 0) {
    updateError('请至少选择一台设备。')
    return
  }

  await withTask('launch', async () => {
    if (selectedDeviceIds.value.length === 1) {
      const session = await createPlaybackSession(apiBaseUrl.value, {
        deviceId: selectedDeviceIds.value[0],
        mediaId: media.id,
        autoplay: launchForm.autoplay,
        startPosition: launchForm.startPosition > 0 ? launchForm.startPosition : undefined,
        volume: launchForm.volume,
      })
      mergeSession(session)
      activeSessionId.value = session.sessionId
    } else {
      const launchedSessions = await startSynchronizedPlayback(apiBaseUrl.value, {
        deviceIds: selectedDeviceIds.value,
        mediaId: media.id,
        autoplay: launchForm.autoplay,
        startPosition: launchForm.startPosition > 0 ? launchForm.startPosition : undefined,
        volume: launchForm.volume,
      })

      launchedSessions.forEach(mergeSession)
      if (launchedSessions[0]) {
        activeSessionId.value = launchedSessions[0].sessionId
      }
    }

    updateFlash(
      selectedDeviceIds.value.length > 1 ? '已发起多设备软同步播放。' : '已发起单设备播放。',
    )
  })
}

const handleControl = async (
  action: 'play' | 'pause' | 'stop' | 'seek' | 'volume',
  payload?: Record<string, number>,
) => {
  if (!activeSessionId.value) {
    updateError('请先选择一个会话，再发送控制命令。')
    return
  }

  await withTask('control', async () => {
    mergeSession(await controlSession(apiBaseUrl.value, activeSessionId.value, action, payload))
  })
}

watch(activeSession, (session) => {
  activeSeekSeconds.value = session?.position ?? 0
  activeVolume.value = session?.volume ?? launchForm.volume
})

onMounted(async () => {
  await refreshEverything()
  refreshTimer = setInterval(() => {
    void refreshActiveSession()
  }, 5000)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-copy">
        <p class="eyebrow">电视播控台</p>
        <h1>局域网投屏与播放控制</h1>
        <p class="lede">发现设备、登记媒体、发起播放，并对当前会话执行暂停、进度跳转和音量控制。</p>
      </div>

      <div class="topbar-meta">
        <label class="field compact">
          <span>API 地址</span>
          <input v-model="apiBaseUrl" type="url" placeholder="http://192.168.124.19:3100" />
        </label>

        <div class="toolbar">
          <button class="button primary" :disabled="loading.health || loading.devices" @click="refreshEverything">
            {{ loading.health || loading.devices ? '刷新中...' : '刷新设备与状态' }}
          </button>
          <button class="button ghost" :disabled="loading.sessions" @click="loadSessions">
            {{ loading.sessions ? '同步中...' : '刷新会话' }}
          </button>
        </div>

        <dl v-if="health" class="health">
          <div>
            <dt>服务状态</dt>
            <dd>{{ health.status }}</dd>
          </div>
          <div>
            <dt>媒体地址</dt>
            <dd>{{ health.publicBaseUrl }}</dd>
          </div>
          <div>
            <dt>静态根路径</dt>
            <dd>{{ health.mediaStaticRoot }}</dd>
          </div>
        </dl>
      </div>
    </header>

    <section v-if="flashMessage" class="banner success">{{ flashMessage }}</section>
    <section v-if="errorMessage" class="banner error">{{ errorMessage }}</section>

    <main class="grid compact-grid">
      <section class="panel devices-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">设备</p>
            <h2>扫描结果</h2>
          </div>
          <button class="button ghost" :disabled="loading.devices" @click="loadDevices">
            {{ loading.devices ? '扫描中...' : '重新扫描' }}
          </button>
        </div>

        <p class="panel-copy">
          当前模式：<strong>{{ syncModeLabel }}</strong>
        </p>

        <div v-if="showDeviceHint" class="hint">
          未发现设备。请确认电视与电脑在同一网段，并检查 `apps/api/.env` 中的
          `NETWORK_INTERFACE=以太网` 是否正确。
        </div>

        <div class="device-list dense-list">
          <label
            v-for="device in devices"
            :key="device.id"
            class="device-card compact-card"
            :class="{ selected: selectedDeviceIds.includes(device.id) }"
          >
            <input :checked="selectedDeviceIds.includes(device.id)" type="checkbox" @change="toggleDevice(device.id)" />
            <div>
              <strong>{{ device.friendlyName }}</strong>
              <p>{{ device.manufacturer || '未知厂商' }} · {{ device.modelName || '未知型号' }}</p>
              <small>
                拖动进度 {{ device.capabilities.canSeek ? '支持' : '不支持' }} · 音量
                {{ device.capabilities.canSetVolume ? '支持' : '不支持' }}
              </small>
            </div>
          </label>
        </div>
      </section>

      <section class="panel launch-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">播放</p>
            <h2>发起任务</h2>
          </div>
          <span class="badge">{{ mediaCountLabel }}</span>
        </div>

        <div class="launch-summary compact-summary">
          <div>
            <span>目标设备</span>
            <strong>{{ selectedDevices.length }}</strong>
            <p>{{ selectedDevices.map((device) => device.friendlyName).join('、') || '尚未选择设备' }}</p>
          </div>
          <div>
            <span>当前媒体</span>
            <strong>{{ selectedMedia?.title || '尚未选择媒体' }}</strong>
            <p>{{ selectedMedia?.url || '请先上传文件或登记一个 URL' }}</p>
          </div>
        </div>

        <div class="forms launch-form compact-form">
          <label class="field compact">
            <span>启动方式</span>
            <select v-model="launchForm.autoplay">
              <option :value="true">加载后立即播放</option>
              <option :value="false">只加载不播放</option>
            </select>
          </label>
          <label class="field compact">
            <span>起始秒数</span>
            <input v-model.number="launchForm.startPosition" type="number" min="0" step="1" />
          </label>
          <label class="field compact">
            <span>初始音量</span>
            <input v-model.number="launchForm.volume" type="range" min="0" max="100" step="1" />
            <small>{{ launchForm.volume }}</small>
          </label>
        </div>

        <button class="button primary wide" :disabled="loading.launch" @click="handleLaunch">
          {{ loading.launch ? '发送中...' : `开始${syncModeLabel}` }}
        </button>
      </section>

      <section class="panel media-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">媒体</p>
            <h2>上传与登记</h2>
          </div>
        </div>

        <div class="forms media-forms">
          <form class="stack compact-stack" @submit.prevent="handleUpload">
            <label class="field compact">
              <span>本地文件</span>
              <input type="file" accept="video/mp4,image/*" @change="onUploadSelected" />
            </label>
            <label class="field compact">
              <span>标题</span>
              <input v-model="uploadForm.title" type="text" placeholder="欢迎视频" />
            </label>
            <label class="field compact">
              <span>类型</span>
              <select v-model="uploadForm.type">
                <option value="video">视频</option>
                <option value="image">图片</option>
              </select>
            </label>
            <button class="button primary" :disabled="loading.upload">
              {{ loading.upload ? '上传中...' : '上传文件' }}
            </button>
          </form>

          <form class="stack compact-stack" @submit.prevent="handleRegisterUrl">
            <label class="field compact">
              <span>远程 URL</span>
              <input v-model="urlForm.url" type="url" placeholder="http://..." />
            </label>
            <label class="field compact">
              <span>内容类型</span>
              <input v-model="urlForm.contentType" type="text" placeholder="video/mp4" />
            </label>
            <label class="field compact">
              <span>标题</span>
              <input v-model="urlForm.title" type="text" placeholder="ERP 下发素材" />
            </label>
            <label class="field compact">
              <span>缩略图 URL</span>
              <input v-model="urlForm.thumbnailUrl" type="url" placeholder="可选" />
            </label>
            <label class="field compact">
              <span>类型</span>
              <select v-model="urlForm.type">
                <option value="video">视频</option>
                <option value="image">图片</option>
              </select>
            </label>
            <button class="button secondary" :disabled="loading.register">
              {{ loading.register ? '登记中...' : '登记 URL' }}
            </button>
          </form>
        </div>

        <div class="media-library compact-library">
          <button
            v-for="asset in mediaLibrary"
            :key="asset.id"
            class="asset-card compact-card"
            :class="{ selected: asset.id === selectedMediaId }"
            @click="selectedMediaId = asset.id"
          >
            <span class="asset-type">{{ asset.type === 'video' ? '视频' : '图片' }}</span>
            <strong>{{ asset.title || asset.id }}</strong>
            <p>{{ asset.contentType }}</p>
            <small>{{ asset.sourceType === 'upload' ? '本地上传' : '远程地址' }} · {{ formatDate(asset.createdAt) }}</small>
          </button>
        </div>
      </section>

      <section class="panel sessions-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">会话</p>
            <h2>当前播放</h2>
          </div>
        </div>

        <div class="session-list dense-list">
          <button
            v-for="session in sessions"
            :key="session.sessionId"
            class="session-card compact-card"
            :class="[session.state, { selected: session.sessionId === activeSessionId }]"
            @click="selectSession(session.sessionId)"
          >
            <div>
              <strong>{{ session.deviceName }}</strong>
              <p>{{ session.media.title || session.media.url }}</p>
            </div>
            <span>{{ session.state }}</span>
          </button>
        </div>
      </section>

      <section v-if="activeSession" class="panel spotlight control-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">控制</p>
            <h2>{{ activeSession.deviceName }}</h2>
          </div>
          <button class="button ghost" @click="refreshActiveSession">立即刷新</button>
        </div>

        <div class="spotlight-meta compact-summary">
          <div>
            <span>状态</span>
            <strong>{{ activeSession.state }}</strong>
            <p>{{ activeSession.transportState || '无 transport 信息' }}</p>
          </div>
          <div>
            <span>进度</span>
            <strong>{{ formatSeconds(activeSession.position) }} / {{ formatSeconds(activeSession.duration) }}</strong>
            <p>{{ progressPercent }}%</p>
          </div>
          <div>
            <span>音量</span>
            <strong>{{ activeSession.volume ?? 0 }}</strong>
            <p>{{ activeSession.lastError || '当前无错误' }}</p>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>

        <div class="control-strip">
          <button class="button primary" :disabled="loading.control" @click="handleControl('play')">播放</button>
          <button class="button secondary" :disabled="loading.control" @click="handleControl('pause')">暂停</button>
          <button class="button ghost" :disabled="loading.control" @click="handleControl('stop')">停止</button>
        </div>

        <div class="forms control-grid compact-form">
          <label class="field compact">
            <span>跳转到</span>
            <input
              v-model.number="activeSeekSeconds"
              type="range"
              min="0"
              :max="Math.max(activeSession.duration, 1)"
              step="1"
            />
            <small>{{ formatSeconds(activeSeekSeconds) }}</small>
          </label>
          <button class="button secondary" :disabled="loading.control" @click="handleControl('seek', { position: activeSeekSeconds })">
            应用进度
          </button>

          <label class="field compact">
            <span>目标音量</span>
            <input v-model.number="activeVolume" type="range" min="0" max="100" step="1" />
            <small>{{ activeVolume }}</small>
          </label>
          <button class="button secondary" :disabled="loading.control" @click="handleControl('volume', { volume: activeVolume })">
            应用音量
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
