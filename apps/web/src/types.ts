export type MediaType = 'video' | 'image'
export type MediaSourceType = 'upload' | 'url'
export type SessionState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error'

export interface DeviceCapabilities {
  canPlay: boolean
  canPause: boolean
  canStop: boolean
  canSeek: boolean
  canSetVolume: boolean
  canGetVolume: boolean
  canGetPosition: boolean
  supportsVideo: boolean
  supportsImage: boolean
  services: string[]
  protocols: string[]
}

export interface DeviceSummary {
  id: string
  location: string
  friendlyName: string
  manufacturer?: string
  modelName?: string
  modelNumber?: string
  udn?: string
  services: string[]
  capabilities: DeviceCapabilities
}

export interface MediaMetadata {
  creator?: string
  artist?: string
  album?: string
  albumArtURI?: string
  subtitlesUrl?: string
}

export interface MediaAsset {
  id?: string
  sourceType: MediaSourceType
  type: MediaType
  url: string
  contentType: string
  title?: string
  thumbnailUrl?: string
  metadata?: MediaMetadata
}

export interface MediaRecord extends MediaAsset {
  id: string
  createdAt: string
  originalName?: string
  storedFileName?: string
  size?: number
}

export interface SessionInfo {
  sessionId: string
  deviceId: string
  deviceName: string
  state: SessionState
  position: number
  duration: number
  volume?: number
  transportState?: string
  media: MediaAsset
  lastError?: string
  updatedAt: string
}

export interface HealthInfo {
  status: string
  publicBaseUrl: string
  mediaStaticRoot: string
}

export interface RegisterUrlPayload {
  url: string
  contentType: string
  type: MediaType
  title?: string
  thumbnailUrl?: string
}

export interface CreateSessionPayload {
  deviceId: string
  mediaId?: string
  media?: MediaAsset
  autoplay?: boolean
  startPosition?: number
  volume?: number
}

export interface SyncPlaybackPayload {
  deviceIds: string[]
  mediaId?: string
  media?: MediaAsset
  autoplay?: boolean
  startPosition?: number
  volume?: number
}
