import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RECONCILIATION_STATUSES } from '../../auth/roles.constants';

export class CreateReconciliationDto {
  @IsDateString() statementDate: string;
  @Type(() => Number) @IsNumber() bankBalance: number;
  @Type(() => Number) @IsNumber() ledgerBalance: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateReconciliationDto {
  @IsOptional() @Type(() => Number) @IsNumber() bankBalance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() ledgerBalance?: number;
  @IsOptional() @IsIn(RECONCILIATION_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class ListReconciliationQueryDto {
  @IsOptional() @IsIn(RECONCILIATION_STATUSES) status?: string;
}
