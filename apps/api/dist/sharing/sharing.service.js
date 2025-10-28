var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service.js';
let SharingService = class SharingService {
    constructor(prisma, audit, rateLimiter) {
        this.prisma = prisma;
        this.audit = audit;
        this.rateLimiter = rateLimiter;
    }
    async updateShareVisibility(detailId, accountId, visibility) {
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
    async querySharedRecords(accountId, options = {}) {
        await this.rateLimiter.consume(`shared-query:${accountId}`, 30, 60_000);
        const instructor = await this.prisma.instructor.findFirst({
            where: { accountId }
        });
        if (!instructor) {
            throw new ForbiddenException('教練帳號不存在');
        }
        const where = {
            shareVisibility: {
                in: instructor.canViewSharedRecords ? ['resort', 'all'] : ['all']
            },
            sharedBy: { not: null }
        };
        if (options.resortId) {
            where.resortId = options.resortId;
        }
        else if (!instructor.canViewSharedRecords) {
            const lesson = await this.prisma.lesson.findFirst({
                where: { instructorId: instructor.id },
                select: { resortId: true }
            });
            if (lesson) {
                where.resortId = lesson.resortId;
            }
        }
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
        await this.audit.log({
            actorId: accountId,
            action: 'shared_records_query',
            entityType: 'lesson_record_detail',
            scope: 'shared',
            count: details.length,
            metadata: options
        });
        return details.map((detail) => ({
            detailId: detail.id,
            lessonRecordId: detail.lessonRecordId,
            lessonDate: detail.lessonRecord.lesson.lessonDate.toISOString(),
            resortId: detail.resortId,
            instructorId: detail.lessonRecord.lesson.instructorId,
            shareVisibility: detail.shareVisibility,
            sharedAt: detail.sharedAt?.toISOString() ?? '',
            sharedBy: detail.sharedBy ?? '',
            studentTypes: detail.studentTypes
        }));
    }
};
SharingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        AuditService,
        RateLimiterService])
], SharingService);
export { SharingService };
//# sourceMappingURL=sharing.service.js.map