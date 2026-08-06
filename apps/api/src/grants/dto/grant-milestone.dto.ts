import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MILESTONE_STATUSES } from '../../auth/roles.constants';

export class CreateGrantMilestoneDto {
  @IsUUID()
  grantId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsIn(MILESTONE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metric?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class UpdateGrantMilestoneDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(MILESTONE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metric?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class ListGrantMilestoneQueryDto {
  @IsOptional()
  @IsUUID()
  grantId?: string;

  @IsOptional()
  @IsIn(MILESTONE_STATUSES)
  status?: string;
}
