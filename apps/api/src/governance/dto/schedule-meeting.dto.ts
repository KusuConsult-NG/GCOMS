import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ScheduleMeetingDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsDateString() meetingDate: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  minutesUrl?: string;
}
