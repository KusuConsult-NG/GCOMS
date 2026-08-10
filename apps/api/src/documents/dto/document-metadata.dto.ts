import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Multipart form fields, so every value arrives as a string. Bounded rather
 * than free: these are written into a record that is listed and searched.
 */
export class DocumentMetadataDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(120) documentType?: string;
  @IsOptional() @IsString() @MaxLength(60) version?: string;
}
