import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { FOLLOW_UP_STATUSES } from '../../auth/roles.constants';

/**
 * A follow-up written to a status outside this set is in no list — not
 * scheduled, not completed, not missed, not cancelled. Every query in the
 * module selects on it, so the record does not error, it stops being counted.
 */
export class UpdateFollowUpStatusDto {
  @IsIn(FOLLOW_UP_STATUSES, {
    message: `status must be one of: ${FOLLOW_UP_STATUSES.join(', ')}`,
  })
  status: string;

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
