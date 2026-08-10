import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFollowUpDto {
  @IsUUID() participantId: string;
  /** Defaults to the caller when omitted — see the controller. */
  @IsOptional() @IsUUID() clinicianId?: string;
  @IsDateString() scheduledDate: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
