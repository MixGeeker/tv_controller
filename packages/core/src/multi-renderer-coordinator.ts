import type { SessionInfo, SynchronizedPlaybackRequest } from "./types";
import { PlaybackSessionManager } from "./playback-session-manager";

export class MultiRendererCoordinator {
  constructor(private readonly sessions: PlaybackSessionManager) {}

  async startPlayback(request: SynchronizedPlaybackRequest): Promise<SessionInfo[]> {
    const results = await Promise.allSettled(
      request.deviceIds.map((deviceId) =>
        this.sessions.createSession({
          deviceId,
          media: request.media,
          options: request.options
        })
      )
    );

    return results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  }
}
