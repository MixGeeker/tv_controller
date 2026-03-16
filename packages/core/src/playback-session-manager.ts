import type {
  ControlSessionPayload,
  DeviceSummary,
  PlaybackRequest,
  RendererClient,
  SessionControlAction,
  SessionInfo
} from "./types";
import { TvControllerError } from "./errors";
import { createSessionId, nowIso } from "./utils";

export interface PlaybackSessionManagerOptions {
  deviceLookup(deviceId: string): Promise<DeviceSummary>;
  rendererFactory(device: DeviceSummary): Promise<RendererClient>;
}

const withError = (session: SessionInfo, error: string): SessionInfo => ({
  ...session,
  state: "error",
  lastError: error,
  updatedAt: nowIso()
});

export class PlaybackSessionManager {
  private readonly sessions = new Map<string, SessionInfo>();
  private readonly renderers = new Map<string, RendererClient>();

  constructor(private readonly options: PlaybackSessionManagerOptions) {}

  async createSession(request: PlaybackRequest): Promise<SessionInfo> {
    const device = await this.options.deviceLookup(request.deviceId);
    const renderer = await this.options.rendererFactory(device);
    const sessionId = createSessionId();

    try {
      const snapshot = await renderer.loadMedia(request.media, request.options);
      const session: SessionInfo = {
        sessionId,
        deviceId: device.id,
        deviceName: device.friendlyName,
        media: request.media,
        state: snapshot.state,
        position: snapshot.position,
        duration: snapshot.duration,
        volume: snapshot.volume,
        transportState: snapshot.transportState,
        updatedAt: nowIso()
      };

      this.sessions.set(sessionId, session);
      this.renderers.set(sessionId, renderer);
      return session;
    } catch (error) {
      throw new TvControllerError(
        "PLAYBACK_START_FAILED",
        error instanceof Error ? error.message : "Unable to start playback"
      );
    }
  }

  listSessions(): SessionInfo[] {
    return [...this.sessions.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getSession(sessionId: string): SessionInfo {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new TvControllerError("SESSION_NOT_FOUND", `Session ${sessionId} does not exist`);
    }

    return session;
  }

  async refreshSession(sessionId: string): Promise<SessionInfo> {
    const session = this.getSession(sessionId);
    const renderer = this.requireRenderer(sessionId);

    try {
      const snapshot = await renderer.getStatus();
      const updated: SessionInfo = {
        ...session,
        state: snapshot.state,
        position: snapshot.position,
        duration: snapshot.duration,
        volume: snapshot.volume,
        transportState: snapshot.transportState,
        updatedAt: nowIso(),
        lastError: undefined
      };

      this.sessions.set(sessionId, updated);
      return updated;
    } catch (error) {
      const failed = withError(session, error instanceof Error ? error.message : "Unable to refresh session");
      this.sessions.set(sessionId, failed);
      return failed;
    }
  }

  async controlSession(
    sessionId: string,
    action: SessionControlAction,
    payload: ControlSessionPayload = {}
  ): Promise<SessionInfo> {
    const session = this.getSession(sessionId);
    const renderer = this.requireRenderer(sessionId);

    try {
      const snapshot =
        action === "play"
          ? await renderer.play()
          : action === "pause"
            ? await renderer.pause()
            : action === "stop"
              ? await renderer.stop()
              : action === "seek"
                ? await renderer.seek(payload.seekSeconds ?? 0)
                : action === "setVolume"
                  ? await renderer.setVolume(payload.volume ?? 0)
                  : await renderer.getStatus();

      const updated: SessionInfo = {
        ...session,
        state: snapshot.state,
        position: snapshot.position,
        duration: snapshot.duration,
        volume: snapshot.volume,
        transportState: snapshot.transportState,
        updatedAt: nowIso(),
        lastError: undefined
      };

      this.sessions.set(sessionId, updated);
      return updated;
    } catch (error) {
      const failed = withError(session, error instanceof Error ? error.message : "Unable to control session");
      this.sessions.set(sessionId, failed);
      return failed;
    }
  }

  private requireRenderer(sessionId: string): RendererClient {
    const renderer = this.renderers.get(sessionId);
    if (!renderer) {
      throw new TvControllerError("SESSION_RENDERER_MISSING", `Renderer for session ${sessionId} is not available`);
    }

    return renderer;
  }
}
