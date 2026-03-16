import { isIP } from "node:net";
import { networkInterfaces } from "node:os";
import { Client as SsdpClient } from "node-ssdp";
import { UpnpDeviceClient } from "upnp-client-ts";

import { TvControllerError } from "./errors";
import type { DeviceCapabilities, DeviceSummary, DiscoveryOptions } from "./types";
import { createStableId } from "./utils";

const DEFAULT_SEARCH_TARGET = "urn:schemas-upnp-org:device:MediaRenderer:1";
const DEFAULT_TIMEOUT_MS = 4_000;
const DEFAULT_SEARCH_TARGETS = [
  "urn:schemas-upnp-org:device:MediaRenderer:1",
  "urn:schemas-upnp-org:service:AVTransport:1",
  "urn:schemas-upnp-org:service:RenderingControl:1",
  "upnp:rootdevice"
];

type RawSsdpHeaders = Record<string, string | string[] | undefined>;

const getHeaderValue = (headers: RawSsdpHeaders, name: string): string | undefined => {
  const value = headers[name] ?? headers[name.toUpperCase()] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const emptyCapabilities = (services: string[], protocols: string[] = []): DeviceCapabilities => ({
  canPlay: services.includes("AVTransport"),
  canPause: services.includes("AVTransport"),
  canStop: services.includes("AVTransport"),
  canSeek: services.includes("AVTransport"),
  canSetVolume: services.includes("RenderingControl"),
  canGetVolume: services.includes("RenderingControl"),
  canGetPosition: services.includes("AVTransport"),
  supportsVideo: true,
  supportsImage: true,
  services,
  protocols
});

const normalizeServiceName = (value: string): string => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return normalized;
  }

  const parts = normalized.split(":");
  return parts[parts.length - 1] ?? normalized;
};

const isRenderableDevice = (services: string[]): boolean =>
  services.includes("AVTransport") || services.includes("RenderingControl");

const resolveInterfaceNames = (options: DiscoveryOptions): string[] | undefined => {
  if (options.interfaces && options.interfaces.length > 0) {
    return options.interfaces;
  }

  if (!options.localAddress || isIP(options.localAddress) === 0) {
    return undefined;
  }

  const interfaces = networkInterfaces();
  const matches = Object.entries(interfaces)
    .filter(([, addresses]) =>
      (addresses ?? []).some((address) => address.family === "IPv4" && !address.internal && address.address === options.localAddress)
    )
    .map(([name]) => name);

  return matches.length > 0 ? matches : undefined;
};

const resolveSearchTargets = (options: DiscoveryOptions): string[] => {
  if (options.searchTargets && options.searchTargets.length > 0) {
    return options.searchTargets;
  }

  if (options.searchTarget) {
    return [options.searchTarget];
  }

  return DEFAULT_SEARCH_TARGETS;
};

const readCapabilities = async (client: UpnpDeviceClient, services: string[]): Promise<DeviceCapabilities> => {
  const protocols = new Set<string>();
  const actionsByService = new Map<string, Set<string>>();

  for (const serviceName of ["AVTransport", "RenderingControl", "ConnectionManager"]) {
    if (!services.includes(serviceName)) {
      continue;
    }

    try {
      const description = await client.getServiceDescription(serviceName);
      actionsByService.set(serviceName, new Set(Object.keys(description.actions)));
    } catch {
      actionsByService.set(serviceName, new Set<string>());
    }
  }

  if (services.includes("ConnectionManager")) {
    try {
      const response = await client.callAction("ConnectionManager", "GetProtocolInfo", {});
      const source = response.Source ?? response.source ?? "";
      for (const protocol of source.split(",")) {
        if (protocol.trim().length > 0) {
          protocols.add(protocol.trim());
        }
      }
    } catch {
      // A number of devices omit ConnectionManager details even when the service exists.
    }
  }

  const avTransportActions = actionsByService.get("AVTransport") ?? new Set<string>();
  const renderingActions = actionsByService.get("RenderingControl") ?? new Set<string>();

  return {
    canPlay: avTransportActions.has("Play") || services.includes("AVTransport"),
    canPause: avTransportActions.has("Pause") || services.includes("AVTransport"),
    canStop: avTransportActions.has("Stop") || services.includes("AVTransport"),
    canSeek: avTransportActions.has("Seek"),
    canSetVolume: renderingActions.has("SetVolume") || services.includes("RenderingControl"),
    canGetVolume: renderingActions.has("GetVolume") || services.includes("RenderingControl"),
    canGetPosition: avTransportActions.has("GetPositionInfo") || services.includes("AVTransport"),
    supportsVideo: true,
    supportsImage: true,
    services,
    protocols: [...protocols]
  };
};

export const resolveDeviceFromLocation = async (location: string): Promise<DeviceSummary> => {
  const client = new UpnpDeviceClient(location);
  const description = await client.getDeviceDescription();
  const services = Object.keys(description.services).map((serviceName) => normalizeServiceName(serviceName));
  const capabilities = await readCapabilities(client, services);

  return {
    id: createStableId(description.UDN || location),
    location,
    friendlyName: description.friendlyName || location,
    manufacturer: description.manufacturer,
    modelName: description.modelName,
    modelNumber: description.modelNumber,
    udn: description.UDN,
    services,
    capabilities
  };
};

export class DeviceDiscovery {
  constructor(private readonly defaults: DiscoveryOptions = {}) {}

  async discover(options: DiscoveryOptions = {}): Promise<DeviceSummary[]> {
    const mergedOptions: DiscoveryOptions = { ...this.defaults, ...options };
    const explicitLocations = mergedOptions.explicitLocations ?? [];
    const discoveredLocations = new Set<string>(explicitLocations);
    const timeoutMs = mergedOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const searchTargets = resolveSearchTargets(mergedOptions);
    const interfaces = resolveInterfaceNames(mergedOptions);

    if (explicitLocations.length === 0) {
      const client = new SsdpClient({
        interfaces,
        explicitSocketBind: mergedOptions.explicitSocketBind ?? Boolean(interfaces && interfaces.length > 0)
      });

      await new Promise<void>((resolve) => {
        client.on("response", (headers: RawSsdpHeaders) => {
          const location = getHeaderValue(headers, "LOCATION");
          if (location) {
            discoveredLocations.add(location);
          }
        });

        void client.start().then(() => {
          for (const searchTarget of searchTargets) {
            void client.search(searchTarget);
          }
        }).finally(() => {
          setTimeout(() => {
            client.stop();
            resolve();
          }, timeoutMs);
        });
      });
    }

    const devices = await Promise.allSettled(
      [...discoveredLocations].map(async (location) => resolveDeviceFromLocation(location))
    );

    return devices
      .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
      .filter((device) => isRenderableDevice(device.services))
      .sort((left, right) => left.friendlyName.localeCompare(right.friendlyName));
  }

  async resolveDevice(location: string): Promise<DeviceSummary> {
    try {
      return await resolveDeviceFromLocation(location);
    } catch (error) {
      throw new TvControllerError("DEVICE_RESOLUTION_FAILED", error instanceof Error ? error.message : "Unable to resolve device");
    }
  }

  buildCapabilitiesFallback(services: string[]): DeviceCapabilities {
    return emptyCapabilities(services);
  }
}
