import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SeekSessionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position!: number;
}
