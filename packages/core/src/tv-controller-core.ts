import { DeviceDiscovery } from "./device-discovery";
import { TvControllerError } from "./errors";
import { MultiRendererCoordinator } from "./multi-renderer-coordinator";
import { PlaybackSessionManager } from "./playback-session-manager";
import type {
  ControlSessionPayload,
  DeviceSummary,
  DiscoveryOptions,
  PlaybackRequest,
  RendererClient,
  SessionControlAction,
  SessionInfo,
  SynchronizedPlaybackRequest,
  TvControllerCoreClient
} from "./types";
import { UpnpRenderer } from "./upnp-renderer-client";

export interface TvControllerCoreOptions {
  rendererFactory?(device: DeviceSummary): Promise<RendererClient>;
  localAddress?: string;
  ssdpInterfaces?: string[];
}

export class TvControllerCore implements TvControllerCoreClient {
  private readonly devices = new Map<string, DeviceSummary>();
  private readonly discovery: DeviceDiscovery;
  private readonly sessions: PlaybackSessionManager;
  private readonly multiRendererCoordinator: MultiRendererCoordinator;
  private readonly rendererFactory: (device: DeviceSummary) => Promise<RendererClient>;

  constructor(options: TvControllerCoreOptions = {}) {
    this.discovery = new DeviceDiscovery({
      localAddress: options.localAddress,
      interfaces: options.ssdpInterfaces
    });

    this.rendererFactory =
      options.rendererFactory ??
      (async (device: DeviceSummary) => {
        return new UpnpRenderer(device);
      });

    this.sessions = new PlaybackSessionManager({
      deviceLookup: async (deviceId) => this.requireDevice(deviceId),
      rendererFactory: this.rendererFactory
    });
    this.multiRendererCoordinator = new MultiRendererCoordinator(this.sessions);
  }

  async discoverDevices(options: DiscoveryOptions = {}): Promise<DeviceSummary[]> {
    const devices = await this.discovery.discover(options);

    for (const device of devices) {
      this.devices.set(device.id, device);
    }

    return devices;
  }

  listKnownDevices(): DeviceSummary[] {
    return [...this.devices.values()].sort((left, right) => left.friendlyName.localeCompare(right.friendlyName));
  }

  async getDeviceDetails(deviceId: string): Promise<DeviceSummary> {
    const device = this.devices.get(deviceId);
    if (device) {
      return device;
    }

    throw new TvControllerError("DEVICE_NOT_FOUND", `Device ${deviceId} is not known. Run discovery first.`);
  }

  async createSession(request: PlaybackRequest): Promise<SessionInfo> {
    return this.sessions.createSession(request);
  }

  listSessions(): SessionInfo[] {
    return this.sessions.listSessions();
  }

  getSession(sessionId: string): SessionInfo {
    return this.sessions.getSession(sessionId);
  }

  async refreshSession(sessionId: string): Promise<SessionInfo> {
    return this.sessions.refreshSession(sessionId);
  }

  async controlSession(
    sessionId: string,
    action: SessionControlAction,
    payload: ControlSessionPayload = {}
  ): Promise<SessionInfo> {
    return this.sessions.controlSession(sessionId, action, payload);
  }

  async startSynchronizedPlayback(request: SynchronizedPlaybackRequest): Promise<SessionInfo[]> {
    return this.multiRendererCoordinator.startPlayback(request);
  }

  registerDevice(device: DeviceSummary): void {
    this.devices.set(device.id, device);
  }

  private requireDevice(deviceId: string): DeviceSummary {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new TvControllerError("DEVICE_NOT_FOUND", `Device ${deviceId} is not known. Run discovery first.`);
    }

    return device;
  }
}

export const createTvControllerCore = (options: TvControllerCoreOptions = {}): TvControllerCore =>
  new TvControllerCore(options);
