import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FOLLOW_UP_TYPES } from '../../auth/roles.constants';

export class CreateFollowUpDto {
  @IsUUID() participantId: string;
  /** Defaults to the caller when omitted — see the controller. */
  @IsOptional() @IsUUID() clinicianId?: string;
  @IsDateString() scheduledDate: string;

  /**
   * Why the visit is being scheduled. The clinical workspace marks this
   * required and had nowhere to send it, so every follow-up was recorded as an
   * undifferentiated appointment — a biopsy result and a medication check are
   * not the same visit to whoever works the list.
   *
   * Optional here because follow-ups created before this have none.
   */
  @IsOptional()
  @IsIn(FOLLOW_UP_TYPES, {
    message: `followUpType must be one of: ${FOLLOW_UP_TYPES.join(', ')}`,
  })
  followUpType?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
