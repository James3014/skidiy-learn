var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
let LessonRecordService = class LessonRecordService {
    constructor(prisma, audit, rateLimiter) {
        this.prisma = prisma;
        this.audit = audit;
        this.rateLimiter = rateLimiter;
        this.mapAnalysis = (analysis) => ({
            id: analysis.id,
            analysisGroupId: analysis.analysisGroupId,
            analysisItemId: analysis.analysisItemId,
            customAnalysis: analysis.customAnalysis,
            displayOrder: analysis.displayOrder
        });
        this.mapPractice = (practice) => ({
            id: practice.id,
            skillId: practice.skillId,
            drillId: practice.drillId,
            customDrill: practice.customDrill,
            practiceNotes: practice.practiceNotes,
            displayOrder: practice.displayOrder
        });
    }
    async listPrivateRecords(accountId) {
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
    async listSharedRecords(accountId) {
        const instructor = await this.prisma.instructor.findFirst({
            where: { accountId }
        });
        if (!instructor || !instructor.canViewSharedRecords) {
            return [];
        }
        const details = await this.prisma.lessonRecordDetail.findMany({
            where: {
                shareVisibility: {
                    in: ['resort', 'all']
                },
                sharedBy: {
                    not: null
                },
                resortId: instructor.canViewSharedRecords
                    ? undefined
                    : await this.prisma.lesson
                        .findFirst({ where: { instructorId: instructor.id } })
                        .then((lesson) => lesson?.resortId ?? undefined)
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
        await this.rateLimiter.consume(`shared-query:${accountId}`, 30, 60_000);
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
    async createLessonRecord(dto) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: dto.lessonId },
            include: { record: true }
        });
        if (!lesson) {
            throw new NotFoundException('課程不存在');
        }
        if (lesson.record) {
            throw new ConflictException('此課程已存在教學記錄');
        }
        const payload = {
            summary: dto.summary ?? null,
            videos: dto.videos ? dto.videos : Prisma.JsonNull,
            lesson: {
                connect: { id: dto.lessonId }
            },
            details: {
                create: dto.details.map((detail) => ({
                    studentMapping: { connect: { id: detail.studentMappingId } },
                    resort: { connect: { id: lesson.resortId } },
                    shareVisibility: detail.shareVisibility ?? 'private',
                    studentTypes: detail.studentTypes ?? [],
                    analyses: detail.analyses
                        ? {
                            create: detail.analyses.map((analysis, order) => ({
                                analysisGroupId: analysis.analysisGroupId,
                                analysisItemId: analysis.analysisItemId,
                                customAnalysis: analysis.customAnalysis ?? null,
                                displayOrder: order
                            }))
                        }
                        : undefined,
                    practices: detail.practices
                        ? {
                            create: detail.practices.map((practice, order) => ({
                                skillId: practice.skillId,
                                drillId: practice.drillId,
                                customDrill: practice.customDrill ?? null,
                                practiceNotes: practice.practiceNotes ?? null,
                                displayOrder: order
                            }))
                        }
                        : undefined
                }))
            }
        };
        const record = await this.prisma.$transaction(async (tx) => {
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
        return this.mapLessonRecord(record);
    }
    async reorderAnalyses(detailId, payload) {
        await this.reorderItems('analysis', detailId, payload);
    }
    async reorderPractices(detailId, payload) {
        await this.reorderItems('practice', detailId, payload);
    }
    async reorderItems(type, detailId, payload) {
        const detail = await this.prisma.lessonRecordDetail.findUnique({
            where: { id: detailId },
            include: { lessonRecord: { include: { lesson: true } } }
        });
        if (!detail) {
            throw new NotFoundException('Lesson record detail not found');
        }
        const updates = payload.items.map((item, index) => ({ id: item.id, order: item.displayOrder ?? index }));
        if (type === 'analysis') {
            await this.prisma.$transaction(updates.map((item) => this.prisma.lessonDetailAnalysis.update({
                where: { id: item.id },
                data: { displayOrder: item.order, updatedAt: new Date() }
            })));
        }
        else {
            await this.prisma.$transaction(updates.map((item) => this.prisma.lessonDetailPractice.update({
                where: { id: item.id },
                data: { displayOrder: item.order, updatedAt: new Date() }
            })));
        }
        await this.audit.log({
            actorId: 'system',
            entityId: detail.lessonRecordId,
            entityType: type === 'analysis' ? 'lesson_detail_analysis' : 'lesson_detail_practice',
            action: 'reorder',
            reason: type,
            scope: 'private'
        });
    }
    async createCoachRatings(accountId, payload) {
        const now = new Date();
        const created = await this.prisma.$transaction(payload.ratings.map((rating) => this.prisma.coachAbilityRating.create({
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
        })));
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
    async getLatestRatings(studentMappingId) {
        const detail = await this.prisma.lessonRecordDetail.findFirst({
            where: { studentMappingId },
            select: { id: true }
        });
        if (!detail) {
            return [];
        }
        const ratings = await this.prisma.coachAbilityRating.findMany({
            where: { lessonRecordDetailId: detail.id },
            include: { ability: true },
            orderBy: [{ abilityId: 'asc' }, { ratedAt: 'desc' }]
        });
        const deduped = new Map();
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
    mapLessonRecord(record) {
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
                analyses: detail.analyses.map(this.mapAnalysis),
                practices: detail.practices.map(this.mapPractice),
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
};
LessonRecordService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        AuditService,
        RateLimiterService])
], LessonRecordService);
export { LessonRecordService };
//# sourceMappingURL=lesson-record.service.js.map