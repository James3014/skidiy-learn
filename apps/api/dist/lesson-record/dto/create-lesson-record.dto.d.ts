import { RecordShareVisibility, StudentPersona, CoachProficiencyBand } from '@prisma/client';
export declare class CreateLessonDetailAnalysisDto {
    analysisGroupId?: number;
    analysisItemId?: number;
    customAnalysis?: string;
}
export declare class CreateLessonDetailPracticeDto {
    skillId?: number;
    drillId?: number;
    customDrill?: string;
    practiceNotes?: string;
}
export declare class CreateLessonRecordDetailDto {
    studentMappingId: string;
    shareVisibility?: RecordShareVisibility;
    studentTypes?: StudentPersona[];
    analyses?: CreateLessonDetailAnalysisDto[];
    practices?: CreateLessonDetailPracticeDto[];
}
export declare class CreateLessonRecordDto {
    lessonId: number;
    summary?: string;
    videos?: Array<Record<string, unknown>>;
    details: CreateLessonRecordDetailDto[];
}
export declare class CoachRatingItemDto {
    lessonRecordDetailId: string;
    abilityId: number;
    rating: number;
    proficiencyBand: CoachProficiencyBand;
    comment?: string;
    sourceRatingId?: string;
}
export declare class CreateCoachRatingsDto {
    ratings: CoachRatingItemDto[];
}
export declare class ReorderItemDto {
    id: string;
    displayOrder?: number;
}
export declare class ReorderItemsDto {
    items: ReorderItemDto[];
}
