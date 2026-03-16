import { Injectable } from '@nestjs/common';
import type { SessionInfo } from '@tv-controller/core';
import { CoreService } from '../core/core.service';
import { MediaService } from '../media/media.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { localizeSessionInfo, throwSessionHttpError } from './session-error.utils';
import { SessionStoreService } from './session-store.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly coreService: CoreService,
    private readonly mediaService: MediaService,
    private readonly sessionStore: SessionStoreService,
  ) {}

  listSessions() {
    return this.sessionStore.list();
  }

  async createSession(payload: CreateSessionDto): Promise<SessionInfo> {
    const media = this.mediaService.resolveMediaReference({
      mediaId: payload.mediaId,
      media: payload.media
        ? {
            ...payload.media,
            sourceType: 'url',
          }
        : undefined,
    });

    try {
      const session = await this.coreService.createSession({
        deviceId: payload.deviceId,
        media,
        options: {
          autoplay: payload.autoplay,
          initialSeekSeconds: payload.startPosition,
          initialVolume: payload.volume,
        },
      });

      return this.sessionStore.upsert(localizeSessionInfo(session));
    } catch (error) {
      return throwSessionHttpError(error);
    }
  }

  async getSession(sessionId: string): Promise<SessionInfo> {
    try {
      const session = await this.coreService.refreshSession(sessionId);
      return this.sessionStore.upsert(localizeSessionInfo(session));
    } catch (error) {
      return throwSessionHttpError(error);
    }
  }

  async play(sessionId: string) {
    return this.refreshAndStore(sessionId, 'play');
  }

  async pause(sessionId: string) {
    return this.refreshAndStore(sessionId, 'pause');
  }

  async stop(sessionId: string) {
    return this.refreshAndStore(sessionId, 'stop');
  }

  async seek(sessionId: string, position: number) {
    return this.refreshAndStore(sessionId, 'seek', { seekSeconds: position });
  }

  async setVolume(sessionId: string, volume: number) {
    return this.refreshAndStore(sessionId, 'setVolume', { volume });
  }

  private async refreshAndStore(
    sessionId: string,
    action: 'play' | 'pause' | 'stop' | 'seek' | 'setVolume',
    payload?: { seekSeconds?: number; volume?: number },
  ) {
    try {
      const session = await this.coreService.controlSession(sessionId, action, payload);
      return this.sessionStore.upsert(localizeSessionInfo(session));
    } catch (error) {
      return throwSessionHttpError(error);
    }
  }
}
