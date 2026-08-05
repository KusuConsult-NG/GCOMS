import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Registration intake. Note there is no `registrationId` field: it is assigned
 * by the server (see ParticipantsService.create). `registeredById` is taken from
 * the authenticated user, never the body.
 */
export class CreateParticipantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsDateString({}, { message: 'dateOfBirth must be a valid date' })
  dateOfBirth: string;

  @IsString()
  @MaxLength(32)
  gender: string;

  /** The patient's actual National Identification Number, if they have one. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  // Structured outreach location, previously concatenated into `address`.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lga?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gpsCoordinates?: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  /**
   * Required, and the service rejects `false`. The column defaults to true,
   * which meant consent was recorded as given whether or not it ever was.
   */
  @IsBoolean()
  consentGiven: boolean;
}
