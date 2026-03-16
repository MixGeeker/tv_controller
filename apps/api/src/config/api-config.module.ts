import { DynamicModule, Module, Provider } from '@nestjs/common';
import type { AppConfig } from '../config/app-config';
import { loadAppConfig } from '../config/app-config';

export const APP_CONFIG = Symbol('APP_CONFIG');

@Module({})
export class ApiConfigModule {
  static forRoot(): DynamicModule {
    const configProvider: Provider = {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => loadAppConfig(),
    };

    return {
      module: ApiConfigModule,
      global: true,
      providers: [configProvider],
      exports: [configProvider],
    };
  }
}
