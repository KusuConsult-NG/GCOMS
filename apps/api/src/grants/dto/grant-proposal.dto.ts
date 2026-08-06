import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PROPOSAL_STATUSES } from '../../auth/roles.constants';

export class CreateGrantProposalDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(120) donorName: string;
  @Type(() => Number) @IsNumber() @Min(0) requestedAmount: number;
  @IsDateString() submissionDeadline: string;
  @IsString() @MinLength(1) @MaxLength(120) leadAuthor: string;
  @IsOptional() @IsIn(PROPOSAL_STATUSES) status?: string;
}

export class UpdateGrantProposalDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(120) donorName?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  requestedAmount?: number;
  @IsOptional() @IsDateString() submissionDeadline?: string;
  @IsOptional() @IsString() @MaxLength(120) leadAuthor?: string;
  @IsOptional() @IsIn(PROPOSAL_STATUSES) status?: string;
}

export class ListProposalQueryDto {
  @IsOptional() @IsIn(PROPOSAL_STATUSES) status?: string;
}
