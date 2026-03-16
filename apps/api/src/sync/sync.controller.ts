import { Body, Controller, Post } from '@nestjs/common';
import { SyncPlaybackDto } from './dto/sync-playback.dto';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('play')
  play(@Body() body: SyncPlaybackDto) {
    return this.syncService.play(body);
  }
}
