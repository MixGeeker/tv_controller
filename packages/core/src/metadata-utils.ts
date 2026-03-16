import type { MediaAsset } from "./types";

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const sanitizeMetadataText = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[&<>]/g, " ");

  const collapsed = collapseWhitespace(normalized);
  return collapsed.length > 0 ? collapsed : undefined;
};

export const createRendererMetadata = (media: MediaAsset) => ({
  title: sanitizeMetadataText(media.title),
  creator: sanitizeMetadataText(media.metadata?.creator),
  artist: sanitizeMetadataText(media.metadata?.artist),
  album: sanitizeMetadataText(media.metadata?.album),
  albumArtURI: media.metadata?.albumArtURI ?? media.thumbnailUrl,
  subtitlesUrl: media.metadata?.subtitlesUrl,
  type: media.type
});

export const shouldRetryWithoutRichMetadata = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("findtext") ||
    error.message.includes("errorCode") ||
    error.message.includes("errorDescription")
  );
};
