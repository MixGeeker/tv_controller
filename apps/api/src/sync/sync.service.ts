import { Injectable } from '@nestjs/common';
import { CoreService } from '../core/core.service';
import { MediaService } from '../media/media.service';
import { localizeSessionInfo, throwSessionHttpError } from '../sessions/session-error.utils';
import { SessionStoreService } from '../sessions/session-store.service';
import { SyncPlaybackDto } from './dto/sync-playback.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly coreService: CoreService,
    private readonly mediaService: MediaService,
    private readonly sessionStore: SessionStoreService,
  ) {}

  async play(payload: SyncPlaybackDto) {
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
      const sessions = await this.coreService.startSynchronizedPlayback({
        deviceIds: payload.deviceIds,
        media,
        options: {
          autoplay: payload.autoplay,
          initialSeekSeconds: payload.startPosition,
          initialVolume: payload.volume,
        },
      });

      return this.sessionStore.upsertMany(sessions.map(localizeSessionInfo));
    } catch (error) {
      return throwSessionHttpError(error);
    }
  }
}
