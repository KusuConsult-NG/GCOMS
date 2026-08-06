import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TRANSACTION_TYPES } from '../../auth/roles.constants';

export class CreateFinanceTransactionDto {
  // Non-negative, with direction carried by `type`. A negative expense is an
  // income by another name, and reconciliation totals cannot tell them apart.
  @Type(() => Number) @IsNumber() @Min(0) amount: number;

  @IsIn(TRANSACTION_TYPES, {
    message: `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
  })
  type: string;

  @IsString() @MinLength(1) @MaxLength(120) category: string;
  @IsString() @MinLength(1) @MaxLength(1000) description: string;
}
