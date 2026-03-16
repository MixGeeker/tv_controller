export type MediaType = "video" | "image";
export type MediaSourceType = "url" | "upload";
export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "stopped" | "error";
export type SessionControlAction = "play" | "pause" | "stop" | "seek" | "setVolume" | "refresh";

export interface DeviceCapabilities {
  canPlay: boolean;
  canPause: boolean;
  canStop: boolean;
  canSeek: boolean;
  canSetVolume: boolean;
  canGetVolume: boolean;
  canGetPosition: boolean;
  supportsVideo: boolean;
  supportsImage: boolean;
  services: string[];
  protocols: string[];
}

export interface DeviceSummary {
  id: string;
  location: string;
  friendlyName: string;
  manufacturer?: string;
  modelName?: string;
  modelNumber?: string;
  udn?: string;
  services: string[];
  capabilities: DeviceCapabilities;
}

export interface MediaMetadata {
  title?: string;
  creator?: string;
  artist?: string;
  album?: string;
  albumArtURI?: string;
  subtitlesUrl?: string;
}

export interface MediaAsset {
  id?: string;
  sourceType: MediaSourceType;
  type: MediaType;
  url: string;
  contentType: string;
  title?: string;
  thumbnailUrl?: string;
  dlnaFeatures?: string;
  metadata?: MediaMetadata;
}

export interface PlaybackOptions {
  autoplay?: boolean;
  initialVolume?: number;
  initialSeekSeconds?: number;
}

export interface PlaybackRequest {
  deviceId: string;
  media: MediaAsset;
  options?: PlaybackOptions;
}

export interface SynchronizedPlaybackRequest {
  deviceIds: string[];
  media: MediaAsset;
  options?: PlaybackOptions;
}

export interface TransportSnapshot {
  position: number;
  duration: number;
  volume?: number;
  state: PlaybackState;
  transportState?: string;
}

export interface SessionInfo {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  media: MediaAsset;
  state: PlaybackState;
  position: number;
  duration: number;
  volume?: number;
  transportState?: string;
  lastError?: string;
  updatedAt: string;
}

export interface DiscoveryOptions {
  timeoutMs?: number;
  mx?: number;
  searchTarget?: string;
  searchTargets?: string[];
  explicitLocations?: string[];
  interfaces?: string[];
  explicitSocketBind?: boolean;
  localAddress?: string;
}

export interface ControlSessionPayload {
  seekSeconds?: number;
  volume?: number;
}

export interface RendererClient {
  readonly device: DeviceSummary;
  getCapabilities(): Promise<DeviceCapabilities>;
  loadMedia(media: MediaAsset, options?: PlaybackOptions): Promise<TransportSnapshot>;
  play(): Promise<TransportSnapshot>;
  pause(): Promise<TransportSnapshot>;
  stop(): Promise<TransportSnapshot>;
  seek(seconds: number): Promise<TransportSnapshot>;
  getVolume(): Promise<number | undefined>;
  setVolume(volume: number): Promise<TransportSnapshot>;
  getStatus(): Promise<TransportSnapshot>;
}

export interface TvControllerCoreClient {
  discoverDevices(options?: DiscoveryOptions): Promise<DeviceSummary[]>;
  listKnownDevices(): DeviceSummary[];
  getDeviceDetails(deviceId: string): Promise<DeviceSummary>;
  createSession(request: PlaybackRequest): Promise<SessionInfo>;
  listSessions(): SessionInfo[];
  getSession(sessionId: string): SessionInfo | Promise<SessionInfo>;
  refreshSession(sessionId: string): Promise<SessionInfo>;
  controlSession(
    sessionId: string,
    action: SessionControlAction,
    payload?: ControlSessionPayload
  ): Promise<SessionInfo>;
  startSynchronizedPlayback(request: SynchronizedPlaybackRequest): Promise<SessionInfo[]>;
  registerDevice(device: DeviceSummary): void;
}
