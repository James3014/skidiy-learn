import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import { CoachRatingResponse, LatestRatingResponse, LessonRecordResponse, PublicLessonRecordResponse } from './dto/lesson-record.response.js';
import { CreateLessonRecordDto, CreateCoachRatingsDto, ReorderItemsDto } from './dto/create-lesson-record.dto.js';
export declare class LessonRecordService {
    private readonly prisma;
    private readonly audit;
    private readonly rateLimiter;
    constructor(prisma: PrismaService, audit: AuditService, rateLimiter: RateLimiterService);
    listPrivateRecords(accountId: string): Promise<LessonRecordResponse[]>;
    listSharedRecords(accountId: string): Promise<PublicLessonRecordResponse[]>;
    createLessonRecord(dto: CreateLessonRecordDto): Promise<LessonRecordResponse>;
    reorderAnalyses(detailId: string, payload: ReorderItemsDto): Promise<void>;
    reorderPractices(detailId: string, payload: ReorderItemsDto): Promise<void>;
    private reorderItems;
    createCoachRatings(accountId: string, payload: CreateCoachRatingsDto): Promise<CoachRatingResponse[]>;
    getLatestRatings(studentMappingId: string): Promise<LatestRatingResponse[]>;
    private mapLessonRecord;
    private mapAnalysis;
    private mapPractice;
}
