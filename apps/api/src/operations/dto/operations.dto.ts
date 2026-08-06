import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ACTION_STATUSES,
  APPLICANT_STAGES,
  CONTRACT_STATUSES,
  GRN_CONDITIONS,
  PLAN_PRIORITIES,
  PLAN_QUARTERS,
  PLAN_STATUSES,
  BOARD_ROLES,
  DONOR_TYPES,
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  MOVEMENT_TYPES,
  QUOTE_STATUSES,
  REPORT_STATUSES,
  REPORT_TYPES,
  RFQ_STATUSES,
  RISK_LEVELS,
  RISK_STATUSES,
  VENDOR_STATUSES,
} from '../../auth/roles.constants';

export class CreateJobOpeningDto {
  @IsString() @MinLength(1) @MaxLength(160) title: string;
  @IsString() @MinLength(1) @MaxLength(120) department: string;
  @IsOptional() @IsIn(EMPLOYMENT_TYPES) employmentType?: string;
  @IsString() @MinLength(1) @MaxLength(160) location: string;
  @IsDateString() deadline: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsIn(JOB_STATUSES) status?: string;
}
export class UpdateJobOpeningDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(120) department?: string;
  @IsOptional() @IsIn(EMPLOYMENT_TYPES) employmentType?: string;
  @IsOptional() @IsString() @MaxLength(160) location?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsIn(JOB_STATUSES) status?: string;
}

export class CreateApplicantDto {
  @IsUUID() jobOpeningId: string;
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsIn(APPLICANT_STAGES) stage?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class UpdateApplicantDto {
  @IsOptional() @IsIn(APPLICANT_STAGES) stage?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CreateTrainingDto {
  @IsOptional() @IsUUID() staffId?: string;
  @IsString() @MinLength(1) @MaxLength(120) staffName: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(120) provider?: string;
  @IsOptional() @IsString() @MaxLength(60) type?: string;
  @IsDateString() trainingDate: string;
  @IsOptional() @IsBoolean() certified?: boolean;
  @IsOptional() @IsDateString() expiryDate?: string;
}
export class UpdateTrainingDto {
  @IsOptional() @IsBoolean() certified?: boolean;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
}

export class CreateVolunteerProfileDto {
  @IsUUID() userId: string;
  @IsString() @MinLength(1) @MaxLength(120) lga: string;
  @IsOptional() @IsString() @MaxLength(120) ward?: string;
  @IsOptional() @IsString() @MaxLength(255) address?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stipend?: number;
}
export class UpdateVolunteerProfileDto {
  @IsOptional() @IsString() @MaxLength(120) lga?: string;
  @IsOptional() @IsString() @MaxLength(120) ward?: string;
  @IsOptional() @IsString() @MaxLength(255) address?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stipend?: number;
  @IsOptional() @IsString() @MaxLength(20) status?: string;
}

export class CreateBoardMemberDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsIn(BOARD_ROLES) role?: string;
  /** Comma-separated; SQLite has no array type. */
  @IsOptional() @IsString() @MaxLength(500) committees?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsDateString() termStart: string;
  @IsDateString() termEnd: string;
}
export class UpdateBoardMemberDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsIn(BOARD_ROLES) role?: string;
  @IsOptional() @IsString() @MaxLength(500) committees?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() termEnd?: string;
  @IsOptional() @IsString() @MaxLength(20) status?: string;
}

export class CreateBoardActionDto {
  @IsString() @MinLength(1) @MaxLength(500) description: string;
  @IsString() @MinLength(1) @MaxLength(120) responsible: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsIn(RISK_LEVELS) priority?: string;
  @IsOptional() @IsUUID() meetingId?: string;
}
export class UpdateBoardActionDto {
  @IsOptional() @IsIn(ACTION_STATUSES) status?: string;
  @IsOptional() @IsIn(RISK_LEVELS) priority?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(120) responsible?: string;
}

export class CreateStockMovementDto {
  @IsUUID() inventoryItemId: string;
  @IsIn(MOVEMENT_TYPES) type: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() @MaxLength(160) fromLocation?: string;
  @IsOptional() @IsString() @MaxLength(160) toLocation?: string;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
  @IsOptional() @IsString() @MaxLength(120) authorisedBy?: string;
  @IsOptional() @IsDateString() movementDate?: string;
  @IsOptional() @IsString() @MaxLength(1000) remarks?: string;
}

export class CreateProjectRiskDto {
  @IsUUID() projectId: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  @IsOptional() @IsIn(RISK_LEVELS) likelihood?: string;
  @IsOptional() @IsIn(RISK_LEVELS) impact?: string;
  @IsOptional() @IsString() @MaxLength(2000) mitigation?: string;
  @IsOptional() @IsString() @MaxLength(120) owner?: string;
}
export class UpdateProjectRiskDto {
  @IsOptional() @IsIn(RISK_LEVELS) likelihood?: string;
  @IsOptional() @IsIn(RISK_LEVELS) impact?: string;
  @IsOptional() @IsIn(RISK_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) mitigation?: string;
  @IsOptional() @IsString() @MaxLength(120) owner?: string;
}

export class CreateDonorDto {
  @IsString() @MinLength(1) @MaxLength(160) organisation: string;
  @IsOptional() @IsString() @MaxLength(80) country?: string;
  @IsOptional() @IsIn(DONOR_TYPES) type?: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;
  @IsOptional() @IsString() @MaxLength(120) contactTitle?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) interests?: string;
  @IsOptional() @IsDateString() lastContact?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class UpdateDonorDto extends CreateDonorDto {
  @IsOptional() @IsString() @MaxLength(160) declare organisation: string;
}

export class CreateReportScheduleDto {
  @IsUUID() grantId: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsIn(REPORT_TYPES) type?: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() @MaxLength(120) officer?: string;
}
export class UpdateReportScheduleDto {
  @IsOptional() @IsIn(REPORT_STATUSES) status?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(120) officer?: string;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
}

export class CreateVendorDto {
  @IsString() @MinLength(1) @MaxLength(160) name: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) rating?: number;
  @IsOptional() @IsString() @MaxLength(60) taxId?: string;
  @IsOptional() @IsIn(VENDOR_STATUSES) status?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}
export class UpdateVendorDto {
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) rating?: number;
  @IsOptional() @IsIn(VENDOR_STATUSES) status?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class CreateRfqDto {
  // No `reference` field: the server allocates it. Accepting one from the
  // client would let a caller claim a reference out of sequence, or collide
  // with the sequence and be told so about a value it never chose.
  @IsString() @MinLength(1) @MaxLength(500) description: string;
  @IsOptional() @IsDateString() closingDate?: string;
}
export class UpdateRfqDto {
  @IsOptional() @IsIn(RFQ_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsDateString() closingDate?: string;
}

export class CreateQuoteDto {
  @IsUUID() rfqId: string;
  @IsUUID() vendorId: string;
  @Type(() => Number) @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() @MaxLength(60) warranty?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) score?: number;
  @IsOptional() @IsIn(QUOTE_STATUSES) status?: string;
}
export class UpdateQuoteDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) score?: number;
  @IsOptional() @IsIn(QUOTE_STATUSES) status?: string;
}

// ---------------- Annual procurement plan ----------------
export class CreatePlanItemDto {
  // Defaults to the current year on the server rather than being required, so a
  // plan cannot be filed against a year the client picked by accident.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear?: number;
  @IsString() @MinLength(1) @MaxLength(120) category: string;
  @IsString() @MinLength(1) @MaxLength(500) description: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsIn(PLAN_QUARTERS) quarter?: string;
  @IsOptional() @IsIn(PLAN_PRIORITIES) priority?: string;
}
export class UpdatePlanItemDto {
  @IsOptional() @IsIn(PLAN_STATUSES) status?: string;
  @IsOptional() @IsIn(PLAN_PRIORITIES) priority?: string;
  @IsOptional() @IsIn(PLAN_QUARTERS) quarter?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) unitPrice?: number;
}

// ---------------- Goods received notes ----------------
export class CreateGrnDto {
  // The order is referenced by id. It used to be a free-text "poRef" that
  // matched nothing, so a note could name an order that did not exist.
  @IsUUID() procurementOrderId: string;
  @IsString() @MinLength(1) @MaxLength(120) deliveryNote: string;
  @IsString() @MinLength(1) @MaxLength(1000) itemsReceived: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsIn(GRN_CONDITIONS) condition?: string;
  @IsDateString() inspectionDate: string;
  @IsString() @MinLength(1) @MaxLength(160) officer: string;
  @IsOptional() @IsString() @MaxLength(1000) remarks?: string;
}

// ---------------- Contracts ----------------
export class CreateContractDto {
  @IsUUID() vendorId: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @Type(() => Number) @IsNumber() @Min(0) value: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() @MaxLength(2000) deliverables?: string;
  @IsOptional() @IsIn(CONTRACT_STATUSES) status?: string;
}
export class UpdateContractDto {
  @IsOptional() @IsIn(CONTRACT_STATUSES) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) deliverables?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
