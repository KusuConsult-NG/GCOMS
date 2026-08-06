import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DOCUMENT_TYPES } from '../../auth/roles.constants';

export class CreateDocumentRecordDto {
  @IsString() @MinLength(1) @MaxLength(300) title: string;

  @IsIn(DOCUMENT_TYPES, {
    message: `documentType must be one of: ${DOCUMENT_TYPES.join(', ')}`,
  })
  documentType: string;

  // A link record rather than an upload. Constrained to http(s) so a stored
  // `javascript:` or `data:` URL cannot be rendered as a link by any screen.
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  url?: string;

  @IsOptional() @IsString() @MaxLength(20) version?: string;
}
