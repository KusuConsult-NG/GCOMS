import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { FACILITY_REQUEST_TYPES } from '../../auth/roles.constants';

export class CreateFacilityRequestDto {
  @IsString() @MinLength(1) @MaxLength(200) facilityName: string;

  @IsIn(FACILITY_REQUEST_TYPES, {
    message: `requestType must be one of: ${FACILITY_REQUEST_TYPES.join(', ')}`,
  })
  requestType: string;

  @IsString() @MinLength(1) @MaxLength(2000) description: string;
}
