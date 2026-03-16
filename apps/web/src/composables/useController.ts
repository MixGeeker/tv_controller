import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type InjectionKey, inject, provide } from 'vue'

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
} from '../api'
import type { DeviceSummary, HealthInfo, MediaRecord, SessionInfo } from '../types'

function createController() {
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

  const selectedMedia = computed(() =>
    mediaLibrary.value.find((item) => item.id === selectedMediaId.value) ?? null,
  )
  const activeSession = computed(() =>
    sessions.value.find((item) => item.sessionId === activeSessionId.value) ?? null,
  )
  const selectedDevices = computed(() =>
    devices.value.filter((device) => selectedDeviceIds.value.includes(device.id)),
  )
  const mediaCountLabel = computed(() => `${mediaLibrary.value.length} 个媒体`)
  const syncModeLabel = computed(() =>
    selectedDeviceIds.value.length > 1 ? '多设备软同步' : '单设备播放',
  )
  const progressPercent = computed(() => {
    if (!activeSession.value || activeSession.value.duration <= 0) return 0
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
    if (!activeSessionId.value) return
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
    if (refreshTimer) clearInterval(refreshTimer)
  })

  return {
    apiBaseUrl,
    health,
    devices,
    mediaLibrary,
    sessions,
    selectedDeviceIds,
    selectedMediaId,
    activeSessionId,
    activeSeekSeconds,
    activeVolume,
    flashMessage,
    errorMessage,
    uploadFile,
    loading,
    uploadForm,
    urlForm,
    launchForm,
    selectedMedia,
    activeSession,
    selectedDevices,
    mediaCountLabel,
    syncModeLabel,
    progressPercent,
    showDeviceHint,
    updateFlash,
    updateError,
    formatSeconds,
    formatDate,
    toggleDevice,
    selectSession,
    loadHealth,
    loadDevices,
    loadMedia,
    loadSessions,
    refreshActiveSession,
    refreshEverything,
    onUploadSelected,
    handleUpload,
    handleRegisterUrl,
    handleLaunch,
    handleControl,
  }
}

export type Controller = ReturnType<typeof createController>

export const controllerKey: InjectionKey<Controller> = Symbol('controller')

export function provideController() {
  const controller = createController()
  provide(controllerKey, controller)
  return controller
}

export function useController(): Controller {
  const controller = inject(controllerKey)
  if (!controller) throw new Error('useController() called without provider')
  return controller
}
