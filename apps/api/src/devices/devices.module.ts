import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [CoreModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
