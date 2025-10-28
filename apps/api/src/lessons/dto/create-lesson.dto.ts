import { IsInt, IsString, IsDateString, Min, Max } from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  resortId!: number;

  @IsString()
  instructorId!: string;

  @IsDateString()
  lessonDate!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  seatCount!: number;
}
