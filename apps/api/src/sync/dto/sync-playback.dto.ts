import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PlaybackMediaDto } from '../../sessions/dto/playback-media.dto';

export class SyncPlaybackDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  deviceIds!: string[];

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
