import { LessonRecordService } from './lesson-record.service.js';
import { LessonRecordResponse, PublicLessonRecordResponse, CoachRatingResponse, LatestRatingResponse } from './dto/lesson-record.response.js';
import { CreateLessonRecordDto, CreateCoachRatingsDto, ReorderItemsDto } from './dto/create-lesson-record.dto.js';
export declare class LessonRecordController {
    private readonly lessonRecordService;
    constructor(lessonRecordService: LessonRecordService);
    listPrivate(accountId: string): Promise<LessonRecordResponse[]>;
    listShared(accountId: string): Promise<PublicLessonRecordResponse[]>;
    create(dto: CreateLessonRecordDto): Promise<LessonRecordResponse>;
    reorderAnalyses(detailId: string, dto: ReorderItemsDto): Promise<void>;
    reorderPractices(detailId: string, dto: ReorderItemsDto): Promise<void>;
    createRatings(accountId: string, dto: CreateCoachRatingsDto): Promise<CoachRatingResponse[]>;
    getLatestRatings(mappingId: string): Promise<LatestRatingResponse[]>;
}
