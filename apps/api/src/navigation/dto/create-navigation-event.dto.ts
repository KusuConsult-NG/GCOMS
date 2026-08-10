import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNavigationEventDto {
  @IsString() @IsNotEmpty() @MaxLength(120) eventType: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
