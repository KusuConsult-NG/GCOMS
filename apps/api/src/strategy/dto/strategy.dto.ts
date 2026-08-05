import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateStrategicGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  targetMetric: number;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}

export class UpdateStrategicGoalDto {
  @IsNumber()
  @IsNotEmpty()
  currentMetric: number;
}
