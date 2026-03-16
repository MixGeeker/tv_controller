import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { lookup as lookupMime } from 'mime-types';
import { randomUUID } from 'crypto';
import type { MediaAsset } from '@tv-controller/core';
import type { AppConfig } from '../config/app-config';
import { buildMediaPublicUrl } from '../config/app-config';
import { Inject } from '@nestjs/common';
import { APP_CONFIG } from '../config/api-config.module';
import type { RegisterUrlMediaDto } from './dto/register-url-media.dto';
import type { UploadMediaBodyDto } from './dto/upload-media-body.dto';
import type { MediaRecord, MediaReferenceInput } from './media.types';
import { decodeUploadedFileName, normalizeUploadedFileName } from './filename.utils';
import { ensureSupportedContentType, inferMediaKind } from './media.utils';

@Injectable()
export class MediaService {
  private readonly catalogPath: string;
  private records = new Map<string, MediaRecord>();

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.catalogPath = join(this.config.uploadsDir, 'media-index.json');
    this.ensureStorage();
    this.loadCatalog();
  }

  listMedia(): MediaRecord[] {
    return [...this.records.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  getMedia(mediaId: string): MediaRecord {
    const record = this.records.get(mediaId);
    if (!record) {
      throw new NotFoundException(`Media ${mediaId} was not found`);
    }

    return record;
  }

  registerUpload(
    file: Express.Multer.File,
    body: UploadMediaBodyDto,
    storedFileName: string,
  ): MediaRecord {
    const originalName = normalizeUploadedFileName(file.originalname);
    const contentType = file.mimetype || lookupMime(originalName)?.toString() || 'application/octet-stream';
    ensureSupportedContentType(contentType);
    const title = body.title?.trim() || originalName;

    const record: MediaRecord = {
      id: randomUUID(),
      sourceType: 'upload',
      type: inferMediaKind(contentType, body.type),
      url: buildMediaPublicUrl(this.config, storedFileName),
      contentType,
      title,
      originalName,
      storedFileName,
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    this.records.set(record.id, record);
    this.persistCatalog();
    return record;
  }

  registerRemoteUrl(payload: RegisterUrlMediaDto): MediaRecord {
    ensureSupportedContentType(payload.contentType);

    const record: MediaRecord = {
      id: randomUUID(),
      sourceType: 'url',
      type: inferMediaKind(payload.contentType, payload.type),
      url: payload.url,
      contentType: payload.contentType,
      title: payload.title ?? payload.url,
      thumbnailUrl: payload.thumbnailUrl,
      createdAt: new Date().toISOString(),
    };

    this.records.set(record.id, record);
    this.persistCatalog();
    return record;
  }

  resolveMediaReference(reference: MediaReferenceInput): MediaAsset {
    if (reference.media) {
      ensureSupportedContentType(reference.media.contentType);
      return {
        ...reference.media,
        sourceType: reference.media.sourceType ?? 'url',
        type: inferMediaKind(reference.media.contentType, reference.media.type),
      };
    }

    if (reference.mediaId) {
      const record = this.getMedia(reference.mediaId);
      return {
        id: record.id,
        type: record.type,
        sourceType: record.sourceType,
        url: record.url,
        contentType: record.contentType,
        title: record.title,
        thumbnailUrl: record.thumbnailUrl,
      };
    }

    throw new NotFoundException('No media reference supplied');
  }

  private ensureStorage() {
    if (!existsSync(this.config.uploadsDir)) {
      mkdirSync(this.config.uploadsDir, { recursive: true });
    }
  }

  private loadCatalog() {
    if (!existsSync(this.catalogPath)) {
      return;
    }

    const parsed = JSON.parse(readFileSync(this.catalogPath, 'utf8')) as MediaRecord[];
    let changed = false;

    const normalized = parsed.map((record) => {
      const nextRecord = this.normalizeCatalogRecord(record);
      changed ||= JSON.stringify(nextRecord) !== JSON.stringify(record);
      return nextRecord;
    });

    this.records = new Map(normalized.map((record) => [record.id, record]));

    if (changed) {
      this.persistCatalog();
    }
  }

  private persistCatalog() {
    const serialized = JSON.stringify(this.listMedia(), null, 2);
    writeFileSync(this.catalogPath, serialized, 'utf8');
  }

  private normalizeCatalogRecord(record: MediaRecord): MediaRecord {
    if (record.sourceType !== 'upload') {
      return record;
    }

    const originalName = record.originalName ? normalizeUploadedFileName(record.originalName) : record.originalName;
    const title = record.title
      ? record.title === record.originalName
        ? originalName
        : decodeUploadedFileName(record.title)
      : record.title;

    return {
      ...record,
      originalName,
      title,
    };
  }
}
