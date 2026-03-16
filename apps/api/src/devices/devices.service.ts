import { Injectable } from '@nestjs/common';
import { CoreService } from '../core/core.service';

@Injectable()
export class DevicesService {
  constructor(private readonly coreService: CoreService) {}

  listDevices() {
    return this.coreService.discoverDevices();
  }

  getDevice(deviceId: string) {
    return this.coreService.getDeviceDetails(deviceId);
  }
}
