import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import { RATE_LIMITS, isRateLimitEnabled } from '../config/rate-limits.js';
import { PAGINATION } from '../config/constants.js';
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
   * 更新教學記錄的共享可見度設定
   *
   * 允許教練調整其教學記錄的共享範圍。支援三種可見度級別：
   * - `private`: 不共享，只有教練本人可見
   * - `resort`: 同雪場的教練可見
   * - `all`: 所有教練可見
   *
   * 只有記錄的擁有者（創建教學記錄的教練）才能修改共享設定。
   * 當設為 `private` 時，會自動清空 `sharedAt` 和 `sharedBy` 欄位。
   *
   * @param detailId - 教學記錄細節的唯一識別碼
   * @param accountId - 請求者的帳號 ID（用於驗證擁有權）
   * @param visibility - 目標可見度級別 ('private' | 'resort' | 'all')
   * @returns 更新後的教學記錄細節物件
   *
   * @throws {NotFoundException} 當指定的教學記錄細節不存在時
   * @throws {ForbiddenException} 當請求者不是記錄擁有者時
   *
   * @example
   * ```typescript
   * // 將記錄設為同雪場共享
   * const result = await service.updateShareVisibility(
   *   'detail-123',
   *   'instructor-account-1',
   *   'resort'
   * );
   * console.log(result.shareVisibility); // 'resort'
   * ```
   *
   * @example 取消共享
   * ```typescript
   * // 將記錄設為私密
   * await service.updateShareVisibility('detail-123', 'instructor-account-1', 'private');
   * // sharedAt 和 sharedBy 會被自動清空
   * ```
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
   * 查詢其他教練共享的教學記錄
   *
   * 根據教練的權限級別返回不同範圍的共享記錄：
   *
   * **一般教練** (`canViewSharedRecords: false`):
   * - 只能看到標記為 `all` 可見度的記錄
   * - 自動限制在自己所屬的雪場內（通過 resortId 過濾）
   *
   * **管理員教練** (`canViewSharedRecords: true`):
   * - 可以看到 `resort` 和 `all` 可見度的記錄
   * - 可以跨雪場查詢
   *
   * 包含 rate limiting 保護（預設: 30 次/分鐘），防止濫用查詢。
   *
   * @param accountId - 查詢者的帳號 ID
   * @param options - 查詢選項
   * @param options.resortId - 按雪場 ID 過濾（可選）
   * @param options.sportType - 按運動類型過濾 ('ski' | 'snowboard')（可選）
   * @param options.limit - 返回記錄數量上限，預設 20
   * @returns 符合條件的共享教學記錄陣列，按共享時間降序排列
   *
   * @throws {ForbiddenException} 當查詢者的教練帳號不存在時
   * @throws {HttpException} 當超過 rate limit 時 (429 Too Many Requests, 錯誤碼: RATE_LIMITED)
   *
   * @example 基本查詢
   * ```typescript
   * // 一般教練查詢共享記錄
   * const records = await service.querySharedRecords('instructor-account-1');
   * console.log(`找到 ${records.length} 筆共享記錄`);
   * ```
   *
   * @example 按雪場過濾
   * ```typescript
   * // 管理員教練查詢特定雪場的共享記錄
   * const records = await service.querySharedRecords('admin-account', {
   *   resortId: 1,
   *   limit: 10
   * });
   * ```
   *
   * @example 按運動類型過濾
   * ```typescript
   * // 只查詢滑雪板的教學記錄
   * const records = await service.querySharedRecords('instructor-account-1', {
   *   sportType: 'snowboard',
   *   limit: 50
   * });
   * ```
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
      take: options.limit ?? PAGINATION.DEFAULT_LIMIT
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
