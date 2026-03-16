import { UpnpDeviceClient, UpnpMediaRendererClient, dlnaHelpers } from "upnp-client-ts";

import type {
  DeviceCapabilities,
  DeviceSummary,
  MediaAsset,
  PlaybackOptions,
  PlaybackState,
  RendererClient,
  TransportSnapshot
} from "./types";
import { createRendererMetadata, shouldRetryWithoutRichMetadata } from "./metadata-utils";
import { clampVolume } from "./utils";

const buildDlnaFeatures = (media: MediaAsset): string | undefined => {
  if (media.dlnaFeatures) {
    return media.dlnaFeatures;
  }

  if (media.type === "video") {
    return [
      dlnaHelpers.getDlnaSeekModeFeature("time"),
      dlnaHelpers.getDlnaTranscodeFeature(false),
      dlnaHelpers.defaultFlags.DLNA_STREAMING_TIME_BASED_FLAGS
    ].join(";");
  }

  return [
    dlnaHelpers.getDlnaSeekModeFeature("none"),
    dlnaHelpers.getDlnaTranscodeFeature(false),
    dlnaHelpers.defaultFlags.DLNA_ORIGIN_FLAGS
  ].join(";");
};

const toPlaybackState = (transportState?: string): PlaybackState => {
  switch (transportState?.toUpperCase()) {
    case "PLAYING":
      return "playing";
    case "PAUSED_PLAYBACK":
    case "PAUSED":
      return "paused";
    case "STOPPED":
      return "stopped";
    case "TRANSITIONING":
      return "loading";
    case "NO_MEDIA_PRESENT":
      return "idle";
    default:
      return "idle";
  }
};

const toSnapshot = async (client: UpnpMediaRendererClient): Promise<TransportSnapshot> => {
  const [transportResult, positionResult, durationResult, volumeResult] = await Promise.allSettled([
    client.getTransportInfo(),
    client.getPosition(),
    client.getDuration(),
    client.getVolume()
  ]);

  const transportInfo = transportResult.status === "fulfilled" ? transportResult.value : undefined;
  const transportState =
    transportInfo?.CurrentTransportState ??
    transportInfo?.CurrentTransportStatus ??
    transportInfo?.TransportState;

  return {
    position: positionResult.status === "fulfilled" ? positionResult.value : 0,
    duration: durationResult.status === "fulfilled" ? durationResult.value : 0,
    volume: volumeResult.status === "fulfilled" ? volumeResult.value : undefined,
    state: toPlaybackState(transportState),
    transportState
  };
};

export class UpnpRenderer implements RendererClient {
  private readonly deviceClient: UpnpDeviceClient;
  private readonly rendererClient: UpnpMediaRendererClient;

  constructor(readonly device: DeviceSummary) {
    this.deviceClient = new UpnpDeviceClient(device.location);
    this.rendererClient = new UpnpMediaRendererClient(device.location);
  }

  async getCapabilities(): Promise<DeviceCapabilities> {
    return this.device.capabilities;
  }

  async loadMedia(media: MediaAsset, options: PlaybackOptions = {}): Promise<TransportSnapshot> {
    const baseOptions = {
      autoplay: options.autoplay ?? true,
      contentType: media.contentType,
      dlnaFeatures: buildDlnaFeatures(media)
    };
    const rendererMetadata = createRendererMetadata(media);

    try {
      await this.rendererClient.load(media.url, {
        ...baseOptions,
        metadata: rendererMetadata
      });
    } catch (error) {
      if (!shouldRetryWithoutRichMetadata(error)) {
        throw error;
      }

      await this.rendererClient.load(media.url, {
        ...baseOptions,
        metadata: {
          type: media.type
        }
      });
    }

    if (typeof options.initialVolume === "number") {
      await this.rendererClient.setVolume(clampVolume(options.initialVolume));
    }

    if (typeof options.initialSeekSeconds === "number" && options.initialSeekSeconds > 0) {
      try {
        await this.rendererClient.seek(options.initialSeekSeconds);
      } catch {
        // Some renderers do not support seek for images or startup state. We keep the session usable.
      }
    }

    return toSnapshot(this.rendererClient);
  }

  async play(): Promise<TransportSnapshot> {
    await this.rendererClient.play();
    return toSnapshot(this.rendererClient);
  }

  async pause(): Promise<TransportSnapshot> {
    await this.rendererClient.pause();
    return toSnapshot(this.rendererClient);
  }

  async stop(): Promise<TransportSnapshot> {
    await this.rendererClient.stop();
    return toSnapshot(this.rendererClient);
  }

  async seek(seconds: number): Promise<TransportSnapshot> {
    await this.rendererClient.seek(seconds);
    return toSnapshot(this.rendererClient);
  }

  async getVolume(): Promise<number | undefined> {
    try {
      return await this.rendererClient.getVolume();
    } catch {
      return undefined;
    }
  }

  async setVolume(volume: number): Promise<TransportSnapshot> {
    await this.rendererClient.setVolume(clampVolume(volume));
    return toSnapshot(this.rendererClient);
  }

  async getStatus(): Promise<TransportSnapshot> {
    return toSnapshot(this.rendererClient);
  }
}
