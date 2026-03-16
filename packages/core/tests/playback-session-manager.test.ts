import { describe, expect, it } from "vitest";

import { PlaybackSessionManager } from "../src/playback-session-manager";
import type {
  DeviceSummary,
  MediaAsset,
  PlaybackOptions,
  RendererClient,
  TransportSnapshot
} from "../src/types";

class FakeRenderer implements RendererClient {
  constructor(readonly device: DeviceSummary) {}

  async getCapabilities() {
    return this.device.capabilities;
  }

  async loadMedia(_media: MediaAsset, options?: PlaybackOptions): Promise<TransportSnapshot> {
    return {
      position: options?.initialSeekSeconds ?? 0,
      duration: 120,
      volume: options?.initialVolume ?? 20,
      state: options?.autoplay === false ? "stopped" : "playing",
      transportState: options?.autoplay === false ? "STOPPED" : "PLAYING"
    };
  }

  async play(): Promise<TransportSnapshot> {
    return { position: 3, duration: 120, volume: 20, state: "playing", transportState: "PLAYING" };
  }

  async pause(): Promise<TransportSnapshot> {
    return { position: 3, duration: 120, volume: 20, state: "paused", transportState: "PAUSED_PLAYBACK" };
  }

  async stop(): Promise<TransportSnapshot> {
    return { position: 0, duration: 120, volume: 20, state: "stopped", transportState: "STOPPED" };
  }

  async seek(seconds: number): Promise<TransportSnapshot> {
    return { position: seconds, duration: 120, volume: 20, state: "playing", transportState: "PLAYING" };
  }

  async getVolume(): Promise<number | undefined> {
    return 20;
  }

  async setVolume(volume: number): Promise<TransportSnapshot> {
    return { position: 3, duration: 120, volume, state: "playing", transportState: "PLAYING" };
  }

  async getStatus(): Promise<TransportSnapshot> {
    return { position: 7, duration: 120, volume: 25, state: "playing", transportState: "PLAYING" };
  }
}

const fakeDevice: DeviceSummary = {
  id: "tv-1",
  location: "http://10.0.0.20/device.xml",
  friendlyName: "Living Room TV",
  services: ["AVTransport", "RenderingControl"],
  capabilities: {
    canPlay: true,
    canPause: true,
    canStop: true,
    canSeek: true,
    canSetVolume: true,
    canGetVolume: true,
    canGetPosition: true,
    supportsVideo: true,
    supportsImage: true,
    services: ["AVTransport", "RenderingControl"],
    protocols: []
  }
};

describe("PlaybackSessionManager", () => {
  it("creates and refreshes sessions", async () => {
    const manager = new PlaybackSessionManager({
      deviceLookup: async () => fakeDevice,
      rendererFactory: async (device) => new FakeRenderer(device)
    });

    const session = await manager.createSession({
      deviceId: fakeDevice.id,
      media: {
        sourceType: "url",
        type: "video",
        url: "http://localhost/media/video.mp4",
        contentType: "video/mp4",
        title: "Demo"
      }
    });

    expect(session.deviceName).toBe("Living Room TV");
    expect(session.state).toBe("playing");

    const refreshed = await manager.refreshSession(session.sessionId);

    expect(refreshed.position).toBe(7);
    expect(refreshed.volume).toBe(25);
  });

  it("supports seek and volume actions", async () => {
    const manager = new PlaybackSessionManager({
      deviceLookup: async () => fakeDevice,
      rendererFactory: async (device) => new FakeRenderer(device)
    });

    const session = await manager.createSession({
      deviceId: fakeDevice.id,
      media: {
        sourceType: "url",
        type: "video",
        url: "http://localhost/media/video.mp4",
        contentType: "video/mp4",
        title: "Demo"
      }
    });

    const seeked = await manager.controlSession(session.sessionId, "seek", { seekSeconds: 45 });
    expect(seeked.position).toBe(45);

    const volumeUpdated = await manager.controlSession(session.sessionId, "setVolume", { volume: 55 });
    expect(volumeUpdated.volume).toBe(55);
  });
});
