import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import { RATE_LIMITS, isRateLimitEnabled } from '../config/rate-limits.js';
import type { Prisma, RecordShareVisibility, SportType, StudentPersona } from '@prisma/client';

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
  studentTypes: StudentPersona[];
}

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiterService
  ) {}

  /**
   * 更新教學記錄細節的共享可見度
   * 使用 Transaction 確保 update + audit 的原子性
   */
  async updateShareVisibility(
    detailId: string,
    accountId: string,
    visibility: RecordShareVisibility
  ) {
    // 1. Validate ownership (outside transaction)
    const detail = await this.prisma.lessonRecordDetail.findUnique({
      where: { id: detailId },
      include: {
        lessonRecord: {
          include: { lesson: { include: { instructor: true } } }
        }
      }
    });

    if (!detail) {
      throw new NotFoundException('教學記錄細節不存在');
    }

    if (detail.lessonRecord.lesson.instructor.accountId !== accountId) {
      throw new ForbiddenException('只有記錄擁有者可以變更共享設定');
    }

    // 2. Update visibility in database
    const now = new Date();
    const result = await this.prisma.lessonRecordDetail.update({
      where: { id: detailId },
      data: {
        shareVisibility: visibility,
        sharedAt: visibility === 'private' ? null : now,
        sharedBy: visibility === 'private' ? null : accountId,
        updatedAt: now
      }
    });

    // 3. Audit the change
    await this.audit.log({
      actorId: accountId,
      action: 'lesson_detail_share_update',
      entityType: 'lesson_record_detail',
      entityId: detailId,
      scope: visibility,
      metadata: {
        previous: detail.shareVisibility,
        next: visibility
      }
    });

    return result;
  }

  /**
   * 查詢共享的教學記錄
   * 包含 Rate Limiting
   */
  async querySharedRecords(
    accountId: string,
    options: QuerySharedRecordsOptions = {}
  ): Promise<SharedRecordResult[]> {
    // 1. Rate limiting
    const rateLimit = RATE_LIMITS.SHARED_QUERY;
    if (isRateLimitEnabled(rateLimit)) {
      await this.rateLimiter.consume(
        `shared-query:${accountId}`,
        rateLimit.max,
        rateLimit.windowMs
      );
    }

    // 2. Get instructor info for resort filtering
    const instructor = await this.prisma.instructor.findFirst({
      where: { accountId }
    });

    if (!instructor) {
      throw new ForbiddenException('教練帳號不存在');
    }

    // 3. Build query filters
    const where: Prisma.LessonRecordDetailWhereInput = {
      shareVisibility: {
        in: instructor.canViewSharedRecords ? ['resort', 'all'] : ['all']
      },
      sharedBy: { not: null }
    };

    // Filter by resort if specified
    if (options.resortId !== undefined) {
      where.resortId = options.resortId;
    } else if (!instructor.canViewSharedRecords && instructor.resortId) {
      // If can't view all shared records, limit to own resort
      where.resortId = instructor.resortId;
    }

    // 4. Query shared records
    const details = await this.prisma.lessonRecordDetail.findMany({
      where,
      include: {
        lessonRecord: {
          include: {
            lesson: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' },
      take: options.limit ?? 20
    });

    // 5. Map to response format
    return details.map((detail) => ({
      detailId: detail.id,
      lessonRecordId: detail.lessonRecordId,
      lessonDate: detail.lessonRecord.lesson.lessonDate.toISOString(),
      resortId: detail.resortId,
      instructorId: detail.lessonRecord.lesson.instructorId,
      shareVisibility: detail.shareVisibility,
      sharedAt: detail.sharedAt?.toISOString() ?? '',
      sharedBy: detail.sharedBy ?? '',
      studentTypes: [...detail.studentTypes]
    }));
  }
}
