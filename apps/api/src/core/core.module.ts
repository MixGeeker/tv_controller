import { Module, Provider } from '@nestjs/common';
import { URL } from 'url';
import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/api-config.module';
import { CoreService } from './core.service';
import { TV_CONTROLLER_CORE } from './core.tokens';

type RuntimeCoreModule = {
  createTvControllerCore?: (options?: Record<string, unknown>) => unknown;
  TvControllerCore?: new (options?: Record<string, unknown>) => unknown;
};

const coreProvider: Provider = {
  provide: TV_CONTROLLER_CORE,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig) => {
    const runtimeModule = require('@tv-controller/core') as RuntimeCoreModule;
    let localAddress: string | undefined;

    try {
      localAddress = new URL(config.publicBaseUrl).hostname;
    } catch {
      localAddress = undefined;
    }

    const options = {
      localAddress,
      ssdpInterfaces: config.networkInterface ? [config.networkInterface] : undefined,
    };

    if (typeof runtimeModule.createTvControllerCore === 'function') {
      return runtimeModule.createTvControllerCore(options);
    }

    if (typeof runtimeModule.TvControllerCore === 'function') {
      return new runtimeModule.TvControllerCore(options);
    }

    throw new Error(
      'Unsupported @tv-controller/core export shape. Expected createTvControllerCore() or TvControllerCore.',
    );
  },
};

@Module({
  providers: [coreProvider, CoreService],
  exports: [CoreService],
})
export class CoreModule {}
