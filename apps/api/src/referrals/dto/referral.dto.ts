import { IsIn, IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { REFERRAL_STATUSES } from '../../auth/roles.constants';

export class CreateReferralDto {
  @IsUUID() participantId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) referredTo: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) reason: string;
}

export class UpdateReferralStatusDto {
  @IsIn(REFERRAL_STATUSES, {
    message: `status must be one of: ${REFERRAL_STATUSES.join(', ')}`,
  })
  status: string;
}
