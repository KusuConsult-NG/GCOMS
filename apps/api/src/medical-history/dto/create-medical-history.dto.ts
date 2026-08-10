import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateMedicalHistoryDto {
  @IsUUID() participantId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) conditionName: string;
  /** A date, not free text: it is compared and ordered downstream. */
  @IsOptional() @IsDateString() diagnosisDate?: string;
  @IsOptional() @IsString() @MaxLength(2000) familyHistory?: string;
  @IsOptional() @IsString() @MaxLength(2000) lifestyleNotes?: string;
  @IsOptional() @IsString() @MaxLength(2000) allergies?: string;
}
