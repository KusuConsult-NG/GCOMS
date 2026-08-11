import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CANCER_TYPES, SCREENING_RESULTS } from '../../auth/roles.constants';

export class CreateScreeningDto {
  @IsUUID() participantId: string;

  /**
   * One of the seventeen categories, not any string up to 120 characters.
   *
   * Two screens wrote this column with different vocabularies — the clinical
   * workspace's seventeen full names and the screening form's four short ones —
   * so 'Cervical Cancer' and 'Cervical Cancer (VIA / Pap)' were both in it,
   * meaning it, and nothing could group on the column.
   */
  @IsIn(CANCER_TYPES, {
    message: `cancerType must be one of: ${CANCER_TYPES.join(', ')}`,
  })
  cancerType: string;

  /**
   * Every positive-case count in this system finds these with a substring
   * match, because the column was unconstrained and held whatever arrived. A
   * new row can no longer be spelled a way those counts miss.
   */
  @IsIn(SCREENING_RESULTS, {
    message: `result must be one of: ${SCREENING_RESULTS.join(', ')}`,
  })
  result: string;

  /**
   * Omitted means the service calculates it. Bounded to the same 0–10 range the
   * calculation produces, so a supplied score cannot sit outside the scale every
   * screen renders against.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  riskScore?: number;
}
