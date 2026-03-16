import type {
  CreateSessionPayload,
  DeviceSummary,
  HealthInfo,
  MediaRecord,
  RegisterUrlPayload,
  SessionInfo,
  SyncPlaybackPayload,
} from './types'

const buildUrl = (baseUrl: string, path: string) =>
  new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString()

const safeJson = async (response: Response) => {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = (await safeJson(response)) as { message?: string | string[] } | string | null
    const message =
      typeof payload === 'string'
        ? payload
        : Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message ?? `Request failed with status ${response.status}`

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const request = async <T>(baseUrl: string, path: string, init?: RequestInit) => {
  const response = await fetch(buildUrl(baseUrl, path), {
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  return parseResponse<T>(response)
}

export const fetchHealth = (baseUrl: string) => request<HealthInfo>(baseUrl, '/health')

export const fetchDevices = (baseUrl: string) => request<DeviceSummary[]>(baseUrl, '/devices')

export const fetchMediaLibrary = (baseUrl: string) => request<MediaRecord[]>(baseUrl, '/media')

export const registerUrlMedia = (baseUrl: string, payload: RegisterUrlPayload) =>
  request<MediaRecord>(baseUrl, '/media/url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

export const uploadMediaFile = (
  baseUrl: string,
  file: File,
  payload: { title?: string; type?: 'video' | 'image' },
) => {
  const formData = new FormData()
  formData.set('file', file)

  if (payload.title) {
    formData.set('title', payload.title)
  }

  if (payload.type) {
    formData.set('type', payload.type)
  }

  return request<MediaRecord>(baseUrl, '/media/upload', {
    method: 'POST',
    body: formData,
  })
}

export const fetchSessions = (baseUrl: string) => request<SessionInfo[]>(baseUrl, '/sessions')

export const fetchSession = (baseUrl: string, sessionId: string) =>
  request<SessionInfo>(baseUrl, `/sessions/${sessionId}`)

export const createPlaybackSession = (baseUrl: string, payload: CreateSessionPayload) =>
  request<SessionInfo>(baseUrl, '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

export const startSynchronizedPlayback = (baseUrl: string, payload: SyncPlaybackPayload) =>
  request<SessionInfo[]>(baseUrl, '/sync/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

export const controlSession = (
  baseUrl: string,
  sessionId: string,
  action: 'play' | 'pause' | 'stop' | 'seek' | 'volume',
  payload?: Record<string, number>,
) =>
  request<SessionInfo>(baseUrl, `/sessions/${sessionId}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })
