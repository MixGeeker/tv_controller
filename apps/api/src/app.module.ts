import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ApiConfigModule } from './config/api-config.module';
import { loadAppConfig } from './config/app-config';
import { DevicesModule } from './devices/devices.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { SessionsModule } from './sessions/sessions.module';
import { SyncModule } from './sync/sync.module';

const appConfig = loadAppConfig();

@Module({
  imports: [
    ApiConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: appConfig.uploadsDir,
      serveRoot: appConfig.mediaStaticRoot,
      serveStaticOptions: {
        index: false,
      },
    }),
    HealthModule,
    DevicesModule,
    MediaModule,
    SessionsModule,
    SyncModule,
  ],
})
export class AppModule {}
