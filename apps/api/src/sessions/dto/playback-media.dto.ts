import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class PlaybackMediaDto {
  @IsIn(['video', 'image'])
  type!: 'video' | 'image';

  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  contentType!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;
}
