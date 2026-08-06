import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class LogVolunteerHoursDto {
  /**
   * Bounded at both ends. The route previously took `{ hours: number }` as an
   * inline type, which the ValidationPipe cannot check, so a negative value
   * would subtract from a volunteer's logged time and an absurd one would
   * stand unchallenged.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24, { message: 'hours cannot exceed 24 for a single task entry' })
  hours: number;
}
