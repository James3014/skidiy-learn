import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import type { RecordShareVisibility, SportType } from '@prisma/client';
export interface QuerySharedRecordsOptions {
    resortId?: number;
    sportType?: SportType;
    limit?: number;
}
export interface SharedRecordResult {
    detailId: string;
    lessonRecordId: string;
    lessonDate: string;
    resortId: number;
    instructorId: string;
    shareVisibility: RecordShareVisibility;
    sharedAt: string;
    sharedBy: string;
    studentTypes: string[];
}
export declare class SharingService {
    private readonly prisma;
    private readonly audit;
    private readonly rateLimiter;
    constructor(prisma: PrismaService, audit: AuditService, rateLimiter: RateLimiterService);
    updateShareVisibility(detailId: string, accountId: string, visibility: RecordShareVisibility): Promise<{
        id: string;
        lessonRecordId: string;
        studentMappingId: string;
        resortId: number;
        shareVisibility: import("@prisma/client").$Enums.RecordShareVisibility;
        studentTypes: import("@prisma/client").$Enums.StudentPersona[];
        sharedAt: Date | null;
        sharedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    querySharedRecords(accountId: string, options?: QuerySharedRecordsOptions): Promise<SharedRecordResult[]>;
}
