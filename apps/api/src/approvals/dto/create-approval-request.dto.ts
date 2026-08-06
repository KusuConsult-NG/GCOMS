import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { APPROVAL_RESOURCE_TYPES } from '../../auth/roles.constants';

/**
 * resourceType is constrained rather than free text: it selects which record an
 * approval decision is applied to, so an unrecognised value produces a request
 * that can be approved but can never execute anything.
 */
export class CreateApprovalRequestDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;

  @IsIn(APPROVAL_RESOURCE_TYPES, {
    message: `resourceType must be one of: ${APPROVAL_RESOURCE_TYPES.join(', ')}`,
  })
  resourceType: string;

  @IsOptional() @IsString() @MaxLength(64) resourceId?: string;
}
