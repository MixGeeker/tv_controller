import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { SeekSessionDto } from './dto/seek-session.dto';
import { SetVolumeDto } from './dto/set-volume.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  listSessions() {
    return this.sessionsService.listSessions();
  }

  @Post()
  createSession(@Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(body);
  }

  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionsService.getSession(id);
  }

  @Post(':id/play')
  playSession(@Param('id') id: string) {
    return this.sessionsService.play(id);
  }

  @Post(':id/pause')
  pauseSession(@Param('id') id: string) {
    return this.sessionsService.pause(id);
  }

  @Post(':id/stop')
  stopSession(@Param('id') id: string) {
    return this.sessionsService.stop(id);
  }

  @Post(':id/seek')
  seekSession(@Param('id') id: string, @Body() body: SeekSessionDto) {
    return this.sessionsService.seek(id, body.position);
  }

  @Post(':id/volume')
  setVolume(@Param('id') id: string, @Body() body: SetVolumeDto) {
    return this.sessionsService.setVolume(id, body.volume);
  }
}
