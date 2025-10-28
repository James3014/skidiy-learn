import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSelfEvaluationDto {
  @ApiProperty({
    description: 'Self-evaluation rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 3
  })
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating!: number;

  @ApiPropertyOptional({
    description: 'Optional comment for self-evaluation',
    example: 'I have some experience with skiing but need more practice on turns'
  })
  @IsOptional()
  @IsString()
  selfComment?: string;
}
