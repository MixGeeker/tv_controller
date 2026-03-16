import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class RegisterUrlMediaDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  contentType!: string;

  @IsOptional()
  @IsIn(['video', 'image'])
  type?: 'video' | 'image';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;
}
