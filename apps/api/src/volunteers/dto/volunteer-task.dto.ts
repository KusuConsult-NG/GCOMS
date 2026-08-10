import { IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class AssignVolunteerTaskDto {
  @IsUUID() outreachId: string;
  @IsUUID() volunteerId: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
}
