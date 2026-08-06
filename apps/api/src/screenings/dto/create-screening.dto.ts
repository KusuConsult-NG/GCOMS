import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateScreeningDto {
  @IsUUID() participantId: string;
  @IsString() @MinLength(1) @MaxLength(120) cancerType: string;
  @IsString() @MinLength(1) @MaxLength(500) result: string;

  /**
   * Omitted means the service calculates it. Bounded to the same 0–10 range the
   * calculation produces, so a supplied score cannot sit outside the scale every
   * screen renders against.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  riskScore?: number;
}
