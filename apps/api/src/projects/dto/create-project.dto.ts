import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString() @MinLength(1) @MaxLength(200) projectName: string;
  @IsString() @MinLength(1) @MaxLength(2000) description: string;
  @Type(() => Number) @IsNumber() @Min(0) budget: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}
