import {
  IsDateString,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateOutreachDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsDateString() date: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}
