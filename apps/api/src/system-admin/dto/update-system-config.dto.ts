import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}
