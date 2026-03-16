import { BadRequestException, Controller, Get, Param, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { MediaService } from './media.service';
import { RegisterUrlMediaDto } from './dto/register-url-media.dto';
import { UploadMediaBodyDto } from './dto/upload-media-body.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  listMedia() {
    return this.mediaService.listMedia();
  }

  @Get(':id')
  getMedia(@Param('id') id: string) {
    return this.mediaService.getMedia(id);
  }

  @Post('url')
  registerUrl(@Body() body: RegisterUrlMediaDto) {
    return this.mediaService.registerRemoteUrl(body);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => callback(null, process.env.UPLOADS_DIR ?? 'apps/api/uploads'),
        filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
    }),
  )
  uploadMedia(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: UploadMediaBodyDto) {
    if (!file) {
      throw new BadRequestException('A file upload is required');
    }

    return this.mediaService.registerUpload(file, body, file.filename);
  }
}
