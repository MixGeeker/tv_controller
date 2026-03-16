import { Inject, Injectable } from '@nestjs/common';
import type {
  ControlSessionPayload,
  DeviceSummary,
  MediaAsset,
  PlaybackOptions,
  PlaybackRequest,
  SessionControlAction,
  SessionInfo,
  SynchronizedPlaybackRequest,
  TvControllerCoreClient,
} from '@tv-controller/core';
import { TV_CONTROLLER_CORE } from './core.tokens';

@Injectable()
export class CoreService {
  constructor(
    @Inject(TV_CONTROLLER_CORE)
    private readonly client: TvControllerCoreClient,
  ) {}

  discoverDevices(): Promise<DeviceSummary[]> {
    return this.client.discoverDevices();
  }

  getDeviceDetails(deviceId: string): Promise<DeviceSummary> {
    return this.client.getDeviceDetails(deviceId);
  }

  createSession(request: PlaybackRequest): Promise<SessionInfo> {
    return this.client.createSession(request);
  }

  getSession(sessionId: string): Promise<SessionInfo> {
    return Promise.resolve(this.client.getSession(sessionId));
  }

  refreshSession(sessionId: string): Promise<SessionInfo> {
    return this.client.refreshSession(sessionId);
  }

  controlSession(
    sessionId: string,
    action: SessionControlAction,
    payload?: ControlSessionPayload,
  ): Promise<SessionInfo> {
    return this.client.controlSession(sessionId, action, payload);
  }

  startSynchronizedPlayback(request: SynchronizedPlaybackRequest): Promise<SessionInfo[]> {
    return this.client.startSynchronizedPlayback(request);
  }
}
