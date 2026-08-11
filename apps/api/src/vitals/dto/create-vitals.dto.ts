import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * A set of clinical observations, bounded to what a living patient produces.
 *
 * These were unvalidated: any number, or a string, reached the column. That
 * matters more here than in most places, because nothing downstream questions a
 * vital sign — it is displayed as recorded, and it is what a clinician reads
 * when deciding what to do next. A systolic of 900 is not a dangerous patient,
 * it is a typo, and the two must not look alike on the screen.
 *
 * The ranges are deliberately wide: wide enough to admit any real emergency,
 * narrow enough to catch a transposed digit or a value entered in the wrong
 * unit. Rejecting a genuine reading would be the worse failure, so where the
 * two trade off, the bound is loose.
 */
export class CreateVitalsDto {
  @IsUUID() participantId: string;

  /** Survivable systolic range, generously bounded at both ends. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(40)
  @Max(300)
  bpSystolic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(200)
  bpDiastolic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  pulseRate?: number;

  /**
   * Breaths per minute. Bounded the same way as the rest: wide enough for any
   * reading a patient can actually produce — severe bradypnoea at one end,
   * severe distress at the other — and narrow enough that a typo does not look
   * like a clinical finding.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(4)
  @Max(80)
  respiratoryRate?: number;

  /** Celsius. Recorded hypothermia and hyperpyrexia both sit inside this. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(25)
  @Max(45)
  temperature?: number;

  /** Kilograms. The upper bound admits any adult; the lower admits a neonate. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(400)
  weightKg?: number;

  /**
   * Centimetres. The lower bound is not cosmetic: BMI divides by the square of
   * this, so a height entered in metres — 1.7 rather than 170 — produces a BMI
   * ten thousand times too large, and it is stored as a number like any other.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(260)
  heightCm?: number;

  /** Percent. Below 50 is not survivable long enough to be typed in. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(100)
  oxygenSat?: number;

  /** Free text the clinician adds alongside the numbers. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
