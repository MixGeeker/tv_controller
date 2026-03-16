import { BadRequestException } from '@nestjs/common';
import type { MediaKind } from './media.types';

const SUPPORTED_MIME_TYPES = new Set([
  'video/mp4',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const ensureSupportedContentType = (contentType: string) => {
  if (!SUPPORTED_MIME_TYPES.has(contentType)) {
    throw new BadRequestException(`Unsupported content type: ${contentType}`);
  }
};

export const inferMediaKind = (contentType: string, explicitType?: MediaKind): MediaKind => {
  if (explicitType) {
    return explicitType;
  }

  if (contentType.startsWith('video/')) {
    return 'video';
  }

  if (contentType.startsWith('image/')) {
    return 'image';
  }

  throw new BadRequestException(`Unable to infer media type from content type: ${contentType}`);
};
