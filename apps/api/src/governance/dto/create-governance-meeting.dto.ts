import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';

export class CreateGovernanceMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  meetingDate: string;

  @IsUrl()
  @IsOptional()
  minutesUrl?: string;
}
