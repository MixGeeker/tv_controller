import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PlaybackMediaDto } from './playback-media.dto';

export class CreateSessionDto {
  @IsString()
  deviceId!: string;

  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlaybackMediaDto)
  media?: PlaybackMediaDto;

  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPosition?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  volume?: number;
}
