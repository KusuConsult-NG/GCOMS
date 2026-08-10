import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommunityDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsString() @IsNotEmpty() @MaxLength(120) lga: string;
  @IsOptional() @IsString() @MaxLength(120) state?: string;
  /** People, so a whole number and not a negative one. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  population?: number;
  @IsOptional() @IsString() @MaxLength(200) leaderName?: string;
}
