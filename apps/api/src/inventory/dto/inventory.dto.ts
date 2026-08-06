import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

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
}
