import type { MediaAsset } from '@tv-controller/core';

export type MediaSourceType = 'upload' | 'url';
export type MediaKind = 'video' | 'image';

export interface MediaRecord extends MediaAsset {
  id: string;
  sourceType: MediaSourceType;
  createdAt: string;
  originalName?: string;
  storedFileName?: string;
  size?: number;
}

export interface MediaReferenceInput {
  mediaId?: string;
  media?: MediaAsset;
}
