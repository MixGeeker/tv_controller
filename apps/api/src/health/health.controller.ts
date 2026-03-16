import { Controller, Get } from '@nestjs/common';
import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/api-config.module';
import { Inject } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      publicBaseUrl: this.config.publicBaseUrl,
      mediaStaticRoot: this.config.mediaStaticRoot,
    };
  }
}
