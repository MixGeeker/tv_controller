import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadMediaBodyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['video', 'image'])
  type?: 'video' | 'image';
}
