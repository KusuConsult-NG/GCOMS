import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { APPOINTMENT_STATUSES } from '../../auth/roles.constants';

export class UpdateAppointmentStatusDto {
  @IsIn(APPOINTMENT_STATUSES, {
    message: `status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`,
  })
  status: string;

  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
