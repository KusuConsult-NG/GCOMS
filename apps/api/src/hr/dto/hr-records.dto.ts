import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LEAVE_STATUSES, LEAVE_TYPES } from '../../auth/roles.constants';

export class CreateLeaveRequestDto {
  /** A User id. The column has no foreign key, so the service checks existence. */
  @IsUUID()
  employeeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(LEAVE_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsIn(LEAVE_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(LEAVE_TYPES)
  type?: string;
}

export class ListLeaveQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsIn(LEAVE_STATUSES)
  status?: string;
}

export class CreateAppraisalDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  period: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}

export class UpdateAppraisalDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  period?: string;
}

export class CreateOnboardingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  employeeName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  role: string;

  @IsOptional() @IsBoolean() identityVerified?: boolean;
  @IsOptional() @IsBoolean() contractSigned?: boolean;
  @IsOptional() @IsBoolean() itProvisioned?: boolean;
  @IsOptional() @IsBoolean() medicalCleared?: boolean;
}

export class UpdateOnboardingDto {
  @IsOptional() @IsBoolean() identityVerified?: boolean;
  @IsOptional() @IsBoolean() contractSigned?: boolean;
  @IsOptional() @IsBoolean() itProvisioned?: boolean;
  @IsOptional() @IsBoolean() medicalCleared?: boolean;
}
