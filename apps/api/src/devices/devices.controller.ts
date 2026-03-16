import { Controller, Get, Param } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  listDevices() {
    return this.devicesService.listDevices();
  }

  @Get(':id')
  getDevice(@Param('id') id: string) {
    return this.devicesService.getDevice(id);
  }
}
