import {
  RecordShareVisibility,
  StudentPersona,
  CoachProficiencyBand
} from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDetailAnalysisDto {
  @IsOptional()
  @IsInt()
  analysisGroupId?: number;

  @IsOptional()
  @IsInt()
  analysisItemId?: number;

  @IsOptional()
  @IsString()
  customAnalysis?: string;
}

export class CreateLessonDetailPracticeDto {
  @IsOptional()
  @IsInt()
  skillId?: number;

  @IsOptional()
  @IsInt()
  drillId?: number;

  @IsOptional()
  @IsString()
  customDrill?: string;

  @IsOptional()
  @IsString()
  practiceNotes?: string;
}

export class CreateLessonRecordDetailDto {
  @IsString()
  @IsNotEmpty()
  studentMappingId!: string;

  @IsOptional()
  @IsEnum(RecordShareVisibility)
  shareVisibility?: RecordShareVisibility;

  @IsOptional()
  @IsArray()
  @IsEnum(StudentPersona, { each: true })
  studentTypes?: StudentPersona[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDetailAnalysisDto)
  @IsArray()
  analyses?: CreateLessonDetailAnalysisDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDetailPracticeDto)
  @IsArray()
  practices?: CreateLessonDetailPracticeDto[];
}

export class CreateLessonRecordDto {
  @IsInt()
  lessonId!: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  videos?: Array<Record<string, unknown>>;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonRecordDetailDto)
  details!: CreateLessonRecordDetailDto[];
}

export class CoachRatingItemDto {
  @IsString()
  lessonRecordDetailId!: string;

  @IsInt()
  abilityId!: number;

  @IsInt()
  @Min(1)
  @Max(3)
  rating!: number;

  @IsEnum(CoachProficiencyBand)
  proficiencyBand!: CoachProficiencyBand;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  sourceRatingId?: string;
}

export class CreateCoachRatingsDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CoachRatingItemDto)
  ratings!: CoachRatingItemDto[];
}

export class ReorderItemDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class ReorderItemsDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
