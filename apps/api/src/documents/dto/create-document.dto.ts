import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  version: string;
}
