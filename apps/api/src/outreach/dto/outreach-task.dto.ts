import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVolunteerTaskDto {
  @IsUUID() volunteerId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
}

/**
 * Hours worked on an outreach task. Bounded because it feeds volunteer hour
 * totals: negative hours silently reduce someone else's contribution in an
 * aggregate, and there is no shift longer than a day.
 */
export class LogHoursDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(24) hours: number;
}
