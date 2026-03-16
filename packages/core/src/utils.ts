import { createHash, randomUUID } from "node:crypto";

export const createStableId = (value: string): string =>
  createHash("sha1").update(value).digest("hex");

export const createSessionId = (): string => randomUUID();

export const clampVolume = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

export const nowIso = (): string => new Date().toISOString();
