import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SERVICE_STATUSES, SERVICE_TYPES } from '../../auth/roles.constants';

export class CreateServiceLogDto {
  @IsUUID() inventoryItemId: string;
  @IsIn(SERVICE_TYPES) serviceType: string;
  @IsString() @MinLength(1) @MaxLength(120) performedBy: string;
  @IsDateString() serviceDate: string;
  @IsDateString() nextDueDate: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsIn(SERVICE_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateServiceLogDto {
  @IsOptional() @IsIn(SERVICE_TYPES) serviceType?: string;
  @IsOptional() @IsString() @MaxLength(120) performedBy?: string;
  @IsOptional() @IsDateString() serviceDate?: string;
  @IsOptional() @IsDateString() nextDueDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) cost?: number;
  @IsOptional() @IsIn(SERVICE_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class ListServiceLogQueryDto {
  @IsOptional() @IsUUID() inventoryItemId?: string;
  @IsOptional() @IsIn(SERVICE_STATUSES) status?: string;
}
