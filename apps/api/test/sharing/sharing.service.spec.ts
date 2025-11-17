import { Test } from '@nestjs/testing';
import { SharingService } from '../../src/sharing/sharing.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../src/audit/audit.service.js';
import { RateLimiterService } from '../../src/rate-limiter/rate-limiter.service.js';
import { RATE_LIMITS } from '../../src/config/rate-limits.js';

describe('SharingService', () => {
  let service: SharingService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let rateLimiterService: RateLimiterService;

  const detailMock = {
    id: 'detail-1',
    shareVisibility: 'private' as const,
    sharedAt: null,
    sharedBy: null,
    updatedAt: new Date(),
    lessonRecord: {
      lesson: {
        instructor: {
          accountId: 'owner-account'
        }
      }
    }
  };

  const instructorMock = {
    id: 'instructor-1',
    accountId: 'account-1',
    canViewSharedRecords: false
  };

  const sharedDetailMock = {
    id: 'detail-2',
    lessonRecordId: 'record-1',
    studentMappingId: 'mapping-1',
    resortId: 1,
    shareVisibility: 'all' as const,
    studentTypes: ['doer'],
    sharedAt: new Date(),
    sharedBy: 'owner-account',
    lessonRecord: {
      id: 'record-1',
      lessonId: 1,
      lesson: {
        id: 1,
        lessonDate: new Date('2024-01-15'),
        instructorId: 'instructor-1'
      }
    }
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SharingService,
        {
          provide: PrismaService,
          useValue: {
            lessonRecordDetail: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn()
            },
            instructor: {
              findFirst: jest.fn()
            },
            lesson: {
              findFirst: jest.fn()
            }
          }
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn()
          }
        },
        {
          provide: RateLimiterService,
          useValue: {
            consume: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<SharingService>(SharingService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    rateLimiterService = module.get<RateLimiterService>(RateLimiterService);
  });

  describe('updateShareVisibility', () => {
    it('應該在擁有者匹配時更新共享可見度', async () => {
      jest.spyOn(prismaService.lessonRecordDetail, 'findUnique').mockResolvedValue(detailMock as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'update').mockResolvedValue({
        ...detailMock,
        shareVisibility: 'resort'
      } as any);

      const result = await service.updateShareVisibility('detail-1', 'owner-account', 'resort');

      expect(result.shareVisibility).toBe('resort');
      expect(prismaService.lessonRecordDetail.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'owner-account',
          action: 'lesson_detail_share_update',
          entityType: 'lesson_record_detail',
          entityId: 'detail-1',
          scope: 'resort',
          metadata: {
            previous: 'private',
            next: 'resort'
          }
        })
      );
    });

    it('應該在帳號不匹配擁有者時拋出 ForbiddenException', async () => {
      jest.spyOn(prismaService.lessonRecordDetail, 'findUnique').mockResolvedValue(detailMock as any);

      await expect(
        service.updateShareVisibility('detail-1', 'some-other', 'resort')
      ).rejects.toThrow(ForbiddenException);
    });

    it('應該在記錄不存在時拋出 NotFoundException', async () => {
      jest.spyOn(prismaService.lessonRecordDetail, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateShareVisibility('detail-1', 'owner-account', 'resort')
      ).rejects.toThrow(NotFoundException);
    });

    it('應該在設為 private 時清空 sharedAt 和 sharedBy', async () => {
      const publicDetail = { ...detailMock, shareVisibility: 'resort', sharedAt: new Date(), sharedBy: 'owner-account' };
      jest.spyOn(prismaService.lessonRecordDetail, 'findUnique').mockResolvedValue(publicDetail as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'update').mockResolvedValue({
        ...publicDetail,
        shareVisibility: 'private',
        sharedAt: null,
        sharedBy: null
      } as any);

      const result = await service.updateShareVisibility('detail-1', 'owner-account', 'private');

      expect(result.shareVisibility).toBe('private');
      expect(prismaService.lessonRecordDetail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shareVisibility: 'private',
            sharedAt: null,
            sharedBy: null
          })
        })
      );
    });
  });

  describe('querySharedRecords', () => {
    it('應該在查詢前執行 rate limiting', async () => {
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(instructorMock as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([]);

      await service.querySharedRecords('account-1', {});

      expect(rateLimiterService.consume).toHaveBeenCalledWith(
        'shared-query:account-1',
        RATE_LIMITS.SHARED_QUERY.max,
        RATE_LIMITS.SHARED_QUERY.windowMs
      );
    });

    it('應該在教練不存在時拋出 ForbiddenException', async () => {
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(null);

      await expect(
        service.querySharedRecords('account-1', {})
      ).rejects.toThrow(ForbiddenException);
    });

    it('應該只返回 "all" 可見度的記錄給無特殊權限的教練', async () => {
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(instructorMock as any);
      jest.spyOn(prismaService.lesson, 'findFirst').mockResolvedValue({ resortId: 1 } as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([sharedDetailMock] as any);

      await service.querySharedRecords('account-1', {});

      expect(prismaService.lessonRecordDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shareVisibility: { in: ['all'] }
          })
        })
      );
    });

    it('應該返回 "resort" 和 "all" 可見度的記錄給有特殊權限的教練', async () => {
      const adminInstructor = { ...instructorMock, canViewSharedRecords: true };
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(adminInstructor as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([sharedDetailMock] as any);

      await service.querySharedRecords('account-1', {});

      expect(prismaService.lessonRecordDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shareVisibility: { in: ['resort', 'all'] }
          })
        })
      );
    });

    it('應該套用 resortId 過濾器', async () => {
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(instructorMock as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([]);

      await service.querySharedRecords('account-1', { resortId: 5 });

      expect(prismaService.lessonRecordDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resortId: 5
          })
        })
      );
    });

    it('應該套用 limit 參數（預設 20）', async () => {
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(instructorMock as any);
      jest.spyOn(prismaService.lesson, 'findFirst').mockResolvedValue({ resortId: 1 } as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([]);

      await service.querySharedRecords('account-1', {});

      expect(prismaService.lessonRecordDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20
        })
      );
    });

    it('應該正確映射回應格式', async () => {
      jest.spyOn(rateLimiterService, 'consume').mockResolvedValue(undefined);
      jest.spyOn(prismaService.instructor, 'findFirst').mockResolvedValue(instructorMock as any);
      jest.spyOn(prismaService.lesson, 'findFirst').mockResolvedValue({ resortId: 1 } as any);
      jest.spyOn(prismaService.lessonRecordDetail, 'findMany').mockResolvedValue([sharedDetailMock] as any);

      const results = await service.querySharedRecords('account-1', {});

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        detailId: 'detail-2',
        lessonRecordId: 'record-1',
        resortId: 1,
        instructorId: 'instructor-1',
        shareVisibility: 'all',
        studentTypes: ['doer']
      });
    });
  });
});
