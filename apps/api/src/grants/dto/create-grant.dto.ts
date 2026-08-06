import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGrantDto {
  @IsString() @MinLength(1) @MaxLength(200) donorName: string;
  @IsString() @MinLength(1) @MaxLength(200) grantName: string;
  @Type(() => Number) @IsNumber() @Min(0) amount: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}
