import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Investigations hang off a ClinicalEncounter, so they are PHI: the controller
 * resolves the encounter's participant and runs the same access check as every
 * other clinical read.
 */
export class CreateInvestigationDto {
  @IsUUID()
  clinicalEncounterId: string;

  @IsString() @MinLength(1) @MaxLength(120) type: string;

  @IsOptional() @IsString() @MaxLength(4000) results?: string;
  @IsOptional() @IsString() @MaxLength(4000) recommendation?: string;
}

export class UpdateInvestigationDto {
  @IsOptional() @IsString() @MaxLength(120) type?: string;
  @IsOptional() @IsString() @MaxLength(4000) results?: string;
  @IsOptional() @IsString() @MaxLength(4000) recommendation?: string;
}
