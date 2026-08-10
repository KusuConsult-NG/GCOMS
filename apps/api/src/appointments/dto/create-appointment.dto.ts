import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID() participantId: string;
  /** Defaults to the caller when omitted — see the controller. */
  @IsOptional() @IsUUID() clinicianId?: string;
  @IsDateString() scheduledAt: string;
  @IsOptional() @IsString() @MaxLength(120) type?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
