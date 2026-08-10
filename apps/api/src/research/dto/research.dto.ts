import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateResearchProjectDto {
  // Trimmed before validation, or `IsNotEmpty` accepts '   ' — it is a non-empty
  // string, and the record ends up titled with whitespace.
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;
}

/**
 * A percentage, so it is bounded at both ends. Unvalidated, this column took
 * -40 and 900 as readily as 50, and the progress bars that render it are sized
 * from the number.
 */
export class UpdateResearchProgressDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100) progress: number;
}
