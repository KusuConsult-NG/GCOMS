import { Type } from 'class-transformer';
import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

/**
 * A purchase requisition. This route took `data: any`, so nothing was checked:
 * quantity and estimatedCost went through parseInt/parseFloat and became NaN
 * for any non-numeric input, which Prisma then rejected as an opaque 400.
 */
export class CreateProcurementOrderDto {
  @IsString() @MinLength(1) @MaxLength(300) itemName: string;
  @Type(() => Number) @IsNumber() @Min(1) quantity: number;
  @Type(() => Number) @IsNumber() @Min(0) estimatedCost: number;
  @IsString() @MinLength(1) @MaxLength(200) vendor: string;
}
