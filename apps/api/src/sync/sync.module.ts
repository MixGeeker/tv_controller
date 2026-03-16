import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { MediaModule } from '../media/media.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [CoreModule, MediaModule, SessionsModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
