import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../auth/roles.constants';

export class CreateProjectTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

/** Every field optional — a status flick from the board sends only `status`. */
export class UpdateProjectTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class ListProjectTaskQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;
}
