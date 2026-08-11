import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CriterionDto {
  @IsString() @MinLength(1) @MaxLength(160) label: string;

  /** Percentage points of the technical score. The set must sum to 100. */
  @Type(() => Number) @IsInt() @Min(1) @Max(100) weight: number;

  /** The scale this criterion is marked on, e.g. 0-5 or 0-10. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxScore?: number;
}

export class SetCriteriaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria: CriterionDto[];

  /**
   * Share of the combined score taken from the technical evaluation. Left alone
   * if omitted; the buyer decides how much price counts, and the default is a
   * conventional 70/30 rather than an opinion baked into the code.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  technicalWeight?: number;
}

export class CriterionMarkDto {
  @IsUUID() criterionId: string;

  /**
   * Bounded above by the criterion's own scale, which the service checks — the
   * upper bound here is only a sanity limit, because a mark above the scale
   * inflates the weighted total silently and the recommendation turns on it.
   */
  @Type(() => Number) @IsInt() @Min(0) @Max(100) score: number;

  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ScoreQuoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterionMarkDto)
  scores: CriterionMarkDto[];
}
