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
import {
  RESOLUTION_STATUSES,
  RESOLUTION_TYPES,
} from '../../auth/roles.constants';

export class CreateBoardResolutionDto {
  // No resolutionNo: the server allocates it, in sequence, per year. Accepting
  // one lets a caller claim a number out of order or collide with the sequence.
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(4000) description: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesFor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) votesAgainst?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) abstentions?: number;

  @IsOptional() @IsIn(RESOLUTION_TYPES) resolutionType?: string;
  @IsOptional() @IsDateString() meetingDate?: string;
  @IsOptional() @IsString() @MaxLength(160) proposedBy?: string;
  @IsOptional() @IsString() @MaxLength(160) secondedBy?: string;

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
