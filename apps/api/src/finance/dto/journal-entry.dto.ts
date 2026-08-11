import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * One side of a voucher.
 *
 * Debit and credit are separate columns rather than one signed amount because
 * a ledger is read as two columns, and a signed amount makes every reader
 * decide which sign means what. The service refuses a line carrying both, and a
 * line carrying neither.
 */
export class JournalLineDto {
  @IsUUID() accountId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit?: number;

  @IsOptional() @IsString() @MaxLength(500) narration?: string;
}

export class CreateJournalEntryDto {
  @IsDateString() entryDate: string;

  @IsString() @MinLength(1) @MaxLength(500) description: string;

  /**
   * Two lines is the minimum that can balance. The service checks the amounts;
   * this checks that there is something to check.
   */
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  /** Set when the voucher is raised from an approved FinanceTransaction. */
  @IsOptional() @IsUUID() sourceTransactionId?: string;
}
