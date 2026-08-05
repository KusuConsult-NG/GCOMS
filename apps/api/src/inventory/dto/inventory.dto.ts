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

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateInventoryItemDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
