import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CANCER_TYPES } from '../../auth/roles.constants';

export class CreateEncounterDto {
  @IsUUID() participantId: string;
  @IsString() @MinLength(1) @MaxLength(5000) notes: string;
  @IsOptional() @IsString() @MaxLength(2000) prognosis?: string;

  /**
   * The classification the encounter form marks "Master Cancer Classification *"
   * and requires.
   *
   * It had nowhere to go. The form required it, the submit handler sent
   * participantId, notes and prognosis, and `whitelist: true` would have
   * stripped it had the handler sent it, because neither this DTO nor the
   * ClinicalEncounter model had the field. A clinician chose a classification,
   * the screen said the encounter had been logged, and the record did not have
   * one — on a clinical note, which is the last place to say a thing was saved
   * when it was not.
   *
   * Optional because encounters recorded before this had none and a follow-up
   * visit need not restate it.
   */
  @IsOptional()
  @IsIn(CANCER_TYPES, {
    message: `cancerType must be one of: ${CANCER_TYPES.join(', ')}`,
  })
  cancerType?: string;
}

export class AssignPatientDto {
  @IsUUID() participantId: string;
  @IsUUID() clinicianId: string;
}

export class EditEncounterDto {
  @IsString() @MinLength(1) @MaxLength(5000) notes: string;
}
