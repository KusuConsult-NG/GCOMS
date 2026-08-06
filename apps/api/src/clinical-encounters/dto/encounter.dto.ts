import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEncounterDto {
  @IsUUID() participantId: string;
  @IsString() @MinLength(1) @MaxLength(5000) notes: string;
  @IsOptional() @IsString() @MaxLength(2000) prognosis?: string;
}

export class AssignPatientDto {
  @IsUUID() participantId: string;
  @IsUUID() clinicianId: string;
}
