import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { MediaModule } from '../media/media.module';
import { SessionStoreService } from './session-store.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [CoreModule, MediaModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionStoreService],
  exports: [SessionsService, SessionStoreService],
})
export class SessionsModule {}
