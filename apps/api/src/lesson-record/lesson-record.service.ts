import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
import { RATE_LIMITS, isRateLimitEnabled } from '../config/rate-limits.js';
import {
  CoachRatingResponse,
  LatestRatingResponse,
  LessonRecordResponse,
  PublicLessonRecordResponse
} from './dto/lesson-record.response.js';
import {
  CreateLessonRecordDto,
  CreateCoachRatingsDto,
  ReorderItemsDto
} from './dto/create-lesson-record.dto.js';

@Injectable()
export class LessonRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rateLimiter: RateLimiterService
  ) {}

  async listPrivateRecords(accountId: string): Promise<LessonRecordResponse[]> {
    const lessons = await this.prisma.lessonRecord.findMany({
      where: {
        lesson: {
          instructor: {
            accountId
          }
        }
      },
      include: {
        lesson: true,
        details: {
          include: {
            analyses: true,
            practices: true,
            coachRatings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return lessons.map((record) => this.mapLessonRecord(record));
  }

  async listSharedRecords(accountId: string): Promise<PublicLessonRecordResponse[]> {
    const instructor = await this.prisma.instructor.findFirst({
      where: { accountId }
    });

    if (!instructor) {
      return [];
    }

    // If canViewSharedRecords is true, instructor can see all resorts' shared records
    // Otherwise, only see records from their own resort
    const resortFilter = instructor.canViewSharedRecords
      ? undefined
      : instructor.resortId;

    const details = await this.prisma.lessonRecordDetail.findMany({
      where: {
        shareVisibility: {
          in: ['resort', 'all']
        },
        sharedBy: {
          not: null
        },
        resortId: resortFilter
      },
      include: {
        lessonRecord: {
          include: {
            lesson: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' }
    });

    // Apply rate limiting if enabled
    const rateLimit = RATE_LIMITS.SHARED_QUERY;
    if (isRateLimitEnabled(rateLimit)) {
      await this.rateLimiter.consume(
        `shared-query:${accountId}`,
        rateLimit.max,
        rateLimit.windowMs
      );
    }

    const mapped = details.map((detail) => ({
      id: detail.lessonRecord.id,
      detailId: detail.id,
      lessonDate: detail.lessonRecord.lesson.lessonDate.toISOString(),
      resortId: detail.resortId,
      instructorId: detail.lessonRecord.lesson.instructorId,
      shareVisibility: detail.shareVisibility
    }));

    await this.audit.log({
      actorId: accountId,
      action: 'lesson_records_shared_query',
      entityType: 'lesson_record_detail',
      count: mapped.length,
      scope: 'shared'
    });

    return mapped;
  }

  async createLessonRecord(dto: CreateLessonRecordDto): Promise<LessonRecordResponse> {
    const lesson = await this.validateLessonForRecord(dto.lessonId);
    const payload = this.buildRecordPayload(dto, lesson.resortId);
    const record = await this.persistRecordWithAudit(payload);
    return this.mapLessonRecord(record);
  }

  private async validateLessonForRecord(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { record: true }
    });

    if (!lesson) {
      throw new NotFoundException('課程不存在');
    }

    if (lesson.record) {
      throw new ConflictException('此課程已存在教學記錄');
    }

    return lesson;
  }

  private buildRecordPayload(
    dto: CreateLessonRecordDto,
    resortId: number
  ): Prisma.LessonRecordCreateInput {
    return {
      summary: dto.summary ?? null,
      videos: dto.videos ? (dto.videos as Prisma.InputJsonValue) : Prisma.JsonNull,
      lesson: { connect: { id: dto.lessonId } },
      details: {
        create: dto.details.map((detail) => ({
          studentMapping: { connect: { id: detail.studentMappingId } },
          resort: { connect: { id: resortId } },
          shareVisibility: detail.shareVisibility ?? 'private',
          studentTypes: detail.studentTypes ?? [],
          analyses: detail.analyses
            ? { create: detail.analyses.map((analysis, order) => ({
                analysisGroupId: analysis.analysisGroupId,
                analysisItemId: analysis.analysisItemId,
                customAnalysis: analysis.customAnalysis ?? null,
                displayOrder: order
              }))}
            : undefined,
          practices: detail.practices
            ? { create: detail.practices.map((practice, order) => ({
                skillId: practice.skillId,
                drillId: practice.drillId,
                customDrill: practice.customDrill ?? null,
                practiceNotes: practice.practiceNotes ?? null,
                displayOrder: order
              }))}
            : undefined
        }))
      }
    };
  }

  private async persistRecordWithAudit(payload: Prisma.LessonRecordCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const createdRecord = await tx.lessonRecord.create({
        data: payload,
        include: {
          lesson: true,
          details: {
            include: {
              analyses: true,
              practices: true,
              coachRatings: true
            }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: 'system',
          entityId: createdRecord.id,
          entityType: 'lesson_record',
          action: 'lesson_record_created',
          reason: 'create_lesson_record',
          scope: 'private',
          performedAt: new Date()
        }
      });

      return createdRecord;
    });
  }

  async reorderAnalyses(detailId: string, payload: ReorderItemsDto): Promise<void> {
    await this.reorderItems('analysis', detailId, payload);
  }

  async reorderPractices(detailId: string, payload: ReorderItemsDto): Promise<void> {
    await this.reorderItems('practice', detailId, payload);
  }

  private async reorderItems(
    type: 'analysis' | 'practice',
    detailId: string,
    payload: ReorderItemsDto
  ): Promise<void> {
    const detail = await this.prisma.lessonRecordDetail.findUnique({
      where: { id: detailId },
      include: { lessonRecord: { include: { lesson: true } } }
    });

    if (!detail) {
      throw new NotFoundException('Lesson record detail not found');
    }

    const updates = payload.items.map((item, index) => ({ id: item.id, order: item.displayOrder ?? index }));

    // Use object mapping to eliminate if/else - Good Taste!
    const modelMap = {
      analysis: this.prisma.lessonDetailAnalysis,
      practice: this.prisma.lessonDetailPractice
    };

    const entityTypeMap = {
      analysis: 'lesson_detail_analysis',
      practice: 'lesson_detail_practice'
    };

    const model = modelMap[type];
    await this.prisma.$transaction(
      updates.map((item) =>
        model.update({
          where: { id: item.id },
          data: { displayOrder: item.order, updatedAt: new Date() }
        })
      )
    );

    await this.audit.log({
      actorId: 'system',
      entityId: detail.lessonRecordId,
      entityType: entityTypeMap[type],
      action: 'reorder',
      reason: type,
      scope: 'private'
    });
  }

  async createCoachRatings(accountId: string, payload: CreateCoachRatingsDto): Promise<CoachRatingResponse[]> {
    const now = new Date();

    const created = await this.prisma.$transaction(
      payload.ratings.map((rating) =>
        this.prisma.coachAbilityRating.create({
          data: {
            lessonRecordDetailId: rating.lessonRecordDetailId,
            abilityId: rating.abilityId,
            rating: rating.rating,
            proficiencyBand: rating.proficiencyBand,
            comment: rating.comment ?? null,
            sourceRatingId: rating.sourceRatingId ?? null,
            ratedBy: accountId,
            ratedAt: now
          }
        })
      )
    );

    await this.audit.log({
      actorId: accountId,
      entityType: 'coach_ability_rating',
      action: 'coach_rating_created',
      count: created.length,
      scope: 'private'
    });

    return created.map((rating) => ({
      id: rating.id,
      lessonRecordDetailId: rating.lessonRecordDetailId,
      abilityId: rating.abilityId,
      rating: rating.rating,
      proficiencyBand: rating.proficiencyBand,
      comment: rating.comment,
      ratedAt: rating.ratedAt.toISOString()
    }));
  }

  async getLatestRatings(studentMappingId: string): Promise<LatestRatingResponse[]> {
    type RatingWithAbility = Prisma.CoachAbilityRatingGetPayload<{ include: { ability: true } }>;

    const detail = await this.prisma.lessonRecordDetail.findFirst({
      where: { studentMappingId },
      select: { id: true }
    });

    if (!detail) {
      return [];
    }

    const ratings: RatingWithAbility[] = await this.prisma.coachAbilityRating.findMany({
      where: { lessonRecordDetailId: detail.id },
      include: { ability: true },
      orderBy: [{ abilityId: 'asc' }, { ratedAt: 'desc' }]
    });

    const deduped = new Map<number, LatestRatingResponse>();
    ratings.forEach((rating) => {
      if (!deduped.has(rating.abilityId)) {
        deduped.set(rating.abilityId, {
          abilityId: rating.abilityId,
          abilityName: rating.ability.name,
          rating: rating.rating,
          proficiencyBand: rating.proficiencyBand,
          comment: rating.comment,
          ratedAt: rating.ratedAt.toISOString()
        });
      }
    });

    return Array.from(deduped.values());
  }

  private mapLessonRecord(record: Prisma.LessonRecordGetPayload<{
    include: {
      lesson: true;
      details: {
        include: {
          analyses: true;
          practices: true;
          coachRatings: true;
        };
      };
    };
  }>): LessonRecordResponse {
    return {
      id: record.id,
      lessonId: record.lessonId,
      summary: record.summary,
      videos: record.videos ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      details: record.details.map((detail) => ({
        id: detail.id,
        lessonRecordId: detail.lessonRecordId,
        studentMappingId: detail.studentMappingId,
        resortId: detail.resortId,
        shareVisibility: detail.shareVisibility,
        studentTypes: detail.studentTypes,
        sharedAt: detail.sharedAt ? detail.sharedAt.toISOString() : null,
        sharedBy: detail.sharedBy,
        analyses: detail.analyses.map((analysis) => ({
          id: analysis.id,
          analysisGroupId: analysis.analysisGroupId,
          analysisItemId: analysis.analysisItemId,
          customAnalysis: analysis.customAnalysis,
          displayOrder: analysis.displayOrder
        })),
        practices: detail.practices.map((practice) => ({
          id: practice.id,
          skillId: practice.skillId,
          drillId: practice.drillId,
          customDrill: practice.customDrill,
          practiceNotes: practice.practiceNotes,
          displayOrder: practice.displayOrder
        })),
        coachRatings: detail.coachRatings.map((rating) => ({
          id: rating.id,
          lessonRecordDetailId: rating.lessonRecordDetailId,
          abilityId: rating.abilityId,
          rating: rating.rating,
          proficiencyBand: rating.proficiencyBand,
          comment: rating.comment,
          ratedAt: rating.ratedAt.toISOString()
        }))
      }))
    };
  }
}
