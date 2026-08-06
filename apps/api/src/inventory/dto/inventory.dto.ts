import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ASSET_CONDITIONS } from '../../auth/roles.constants';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  // Required, because the column is. Declared optional, a create without it
  // reached Prisma as a missing non-null field and failed as an opaque 400.
  @IsString()
  @IsNotEmpty()
  location: string;

  /** The reorder point. Defaults to 10 to match the previous hardcoded value. */
  @IsNumber()
  @Min(0)
  @IsOptional()
  minThreshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  // Fixed-asset register. Only meaningful for equipment, hence all optional.
  @IsString() @IsOptional() @MaxLength(60) assetTag?: string;
  @IsString() @IsOptional() @MaxLength(120) serialNumber?: string;
  @IsString() @IsOptional() @MaxLength(200) currentLocation?: string;
  @IsString() @IsOptional() @MaxLength(160) assignedTo?: string;
  @IsIn(ASSET_CONDITIONS) @IsOptional() condition?: string;
}

export class UpdateInventoryItemDto {
  /**
   * Both optional: the service already treats a missing quantity as "leave it
   * alone", and it reads `data.location` — which this class did not declare, so
   * the global ValidationPipe's whitelist stripped it before the service saw it
   * and moving an item to a new location silently did nothing.
   */
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minThreshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsString() @IsOptional() @MaxLength(60) assetTag?: string;
  @IsString() @IsOptional() @MaxLength(120) serialNumber?: string;
  @IsString() @IsOptional() @MaxLength(200) currentLocation?: string;
  @IsString() @IsOptional() @MaxLength(160) assignedTo?: string;
  @IsIn(ASSET_CONDITIONS) @IsOptional() condition?: string;
}
