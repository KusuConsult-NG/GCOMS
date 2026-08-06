import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RESOLUTION_STATUSES } from '../../auth/roles.constants';

export class CreateBoardResolutionDto {
  @IsString() @MinLength(1) @MaxLength(40) resolutionNo: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(4000) description: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesFor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesAgainst?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) abstentions?: number;

  @IsOptional() @IsIn(RESOLUTION_STATUSES) status?: string;
  @IsOptional() @IsDateString() passedDate?: string;
}

export class UpdateBoardResolutionDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesFor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesAgainst?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) abstentions?: number;
  @IsOptional() @IsIn(RESOLUTION_STATUSES) status?: string;
}

export class ListResolutionQueryDto {
  @IsOptional() @IsIn(RESOLUTION_STATUSES) status?: string;
}
