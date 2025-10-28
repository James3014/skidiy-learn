import { CoachProficiencyBand, RecordShareVisibility, StudentPersona } from '@prisma/client';
export type CoachRatingResponse = {
    id: string;
    lessonRecordDetailId: string;
    abilityId: number;
    rating: number;
    proficiencyBand: CoachProficiencyBand;
    comment: string | null;
    ratedAt: string;
};
export type LessonDetailAnalysisResponse = {
    id: string;
    analysisGroupId: number | null;
    analysisItemId: number | null;
    customAnalysis: string | null;
    displayOrder: number;
};
export type LessonDetailPracticeResponse = {
    id: string;
    skillId: number | null;
    drillId: number | null;
    customDrill: string | null;
    practiceNotes: string | null;
    displayOrder: number;
};
export type LessonRecordDetailResponse = {
    id: string;
    lessonRecordId: string;
    studentMappingId: string;
    resortId: number;
    shareVisibility: RecordShareVisibility;
    studentTypes: StudentPersona[];
    sharedAt: string | null;
    sharedBy: string | null;
    analyses: LessonDetailAnalysisResponse[];
    practices: LessonDetailPracticeResponse[];
    coachRatings: CoachRatingResponse[];
};
export type LessonRecordResponse = {
    id: string;
    lessonId: number;
    summary: string | null;
    videos: unknown;
    createdAt: string;
    updatedAt: string;
    details: LessonRecordDetailResponse[];
};
export type PublicLessonRecordResponse = {
    id: string;
    detailId: string;
    lessonDate: string;
    resortId: number;
    instructorId: string;
    shareVisibility: RecordShareVisibility;
};
export type LatestRatingResponse = {
    abilityId: number;
    abilityName: string;
    rating: number;
    proficiencyBand: CoachProficiencyBand;
    comment: string | null;
    ratedAt: string;
};
