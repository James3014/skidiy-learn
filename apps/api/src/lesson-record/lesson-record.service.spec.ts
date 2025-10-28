import { Test, TestingModule } from '@nestjs/testing';
import { LessonRecordService } from './lesson-record.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoachProficiencyBand, RecordShareVisibility } from '@prisma/client';
import { ReorderItemsDto } from './dto/create-lesson-record.dto';

describe('LessonRecordService', () => {
  let service: LessonRecordService;
  let prisma: PrismaService;
  let audit: AuditService;
  let rateLimiter: RateLimiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonRecordService,
        {
          provide: PrismaService,
          useValue: {
            lessonRecord: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn()
            },
            lessonRecordDetail: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn()
            },
            lesson: {
              findUnique: jest.fn(),
              findFirst: jest.fn()
            },
            instructor: {
              findFirst: jest.fn()
            },
            lessonDetailAnalysis: {
              update: jest.fn()
            },
            lessonDetailPractice: {
              update: jest.fn()
            },
            coachAbilityRating: {
              create: jest.fn(),
              findMany: jest.fn()
            },
            auditLog: {
              create: jest.fn()
            },
            $transaction: jest.fn()
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

    service = module.get<LessonRecordService>(LessonRecordService);
    prisma = module.get<PrismaService>(PrismaService);

    (prisma.$transaction as jest.Mock).mockImplementation(async (work: (tx: any) => Promise<unknown>) => {
      return work(prisma);
    });
    audit = module.get<AuditService>(AuditService);
    rateLimiter = module.get<RateLimiterService>(RateLimiterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listPrivateRecords', () => {
    it('should return instructor private lesson records', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          lessonId: 1,
          summary: 'Test lesson',
          videos: null,
          createdAt: new Date('2024-10-25T10:00:00Z'),
          updatedAt: new Date('2024-10-25T10:00:00Z'),
          lesson: {
            id: 1,
            lessonDate: new Date('2024-10-25')
          },
          details: [
            {
              id: 'detail-1',
              lessonRecordId: 'record-1',
              studentMappingId: 'mapping-1',
              resortId: 1,
              shareVisibility: 'private' as const,
              studentTypes: [],
              sharedAt: null,
              sharedBy: null,
              analyses: [],
              practices: [],
              coachRatings: []
            }
          ]
        }
      ];

      jest.spyOn(prisma.lessonRecord, 'findMany').mockResolvedValue(mockRecords as any);

      const result = await service.listPrivateRecords('account-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('record-1');
      expect(result[0].lessonId).toBe(1);
      expect(result[0].details).toHaveLength(1);
      expect(prisma.lessonRecord.findMany).toHaveBeenCalledWith({
        where: {
          lesson: {
            instructor: {
              accountId: 'account-1'
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
    });

    it('should return empty array when no records found', async () => {
      jest.spyOn(prisma.lessonRecord, 'findMany').mockResolvedValue([]);

      const result = await service.listPrivateRecords('account-1');

      expect(result).toEqual([]);
    });
  });

  describe('listSharedRecords', () => {
    it('should return shared records when instructor has permission', async () => {
      const mockInstructor = {
        id: 'instructor-1',
        accountId: 'account-1',
        canViewSharedRecords: true
      };

      const mockDetails = [
        {
          id: 'detail-1',
          lessonRecordId: 'record-1',
          resortId: 1,
          shareVisibility: 'resort' as const,
          sharedAt: new Date('2024-10-25T10:00:00Z'),
          sharedBy: 'instructor-2',
          lessonRecord: {
            id: 'record-1',
            lesson: {
              lessonDate: new Date('2024-10-25'),
              instructorId: 'instructor-2'
            }
          }
        }
      ];

      jest.spyOn(prisma.instructor, 'findFirst').mockResolvedValue(mockInstructor as any);
      jest.spyOn(prisma.lessonRecordDetail, 'findMany').mockResolvedValue(mockDetails as any);
      jest.spyOn(rateLimiter, 'consume').mockResolvedValue(undefined);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      const result = await service.listSharedRecords('account-1');

      expect(result).toHaveLength(1);
      expect(result[0].detailId).toBe('detail-1');
      expect(result[0].shareVisibility).toBe('resort');
      expect(rateLimiter.consume).toHaveBeenCalledWith('shared-query:account-1', 30, 60_000);
      expect(audit.log).toHaveBeenCalledWith({
        actorId: 'account-1',
        action: 'lesson_records_shared_query',
        entityType: 'lesson_record_detail',
        count: 1,
        scope: 'shared'
      });
    });

    it('should return empty array when instructor has no permission', async () => {
      const mockInstructor = {
        id: 'instructor-1',
        accountId: 'account-1',
        canViewSharedRecords: false
      };

      jest.spyOn(prisma.instructor, 'findFirst').mockResolvedValue(mockInstructor as any);

      const result = await service.listSharedRecords('account-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when instructor not found', async () => {
      jest.spyOn(prisma.instructor, 'findFirst').mockResolvedValue(null);

      const result = await service.listSharedRecords('account-1');

      expect(result).toEqual([]);
    });
  });

  describe('createLessonRecord', () => {
    it('should create lesson record with details', async () => {
      const mockLesson = {
        id: 1,
        resortId: 1,
        record: null
      };

      const createDto = {
        lessonId: 1,
        summary: 'Great progress today',
        videos: undefined,
        details: [
          {
            studentMappingId: 'mapping-1',
            shareVisibility: 'private' as RecordShareVisibility,
            studentTypes: [],
            analyses: [
              {
                analysisGroupId: 1,
                analysisItemId: 10
              }
            ],
            practices: [
              {
                skillId: 5,
                drillId: 20,
                practiceNotes: 'Focus on balance'
              }
            ]
          }
        ]
      };

      const mockCreatedRecord = {
        id: 'record-1',
        lessonId: 1,
        summary: 'Great progress today',
        videos: null,
        createdAt: new Date('2024-10-25T10:00:00Z'),
        updatedAt: new Date('2024-10-25T10:00:00Z'),
        lesson: {
          id: 1,
          lessonDate: new Date('2024-10-25')
        },
        details: [
          {
            id: 'detail-1',
            lessonRecordId: 'record-1',
            studentMappingId: 'mapping-1',
            resortId: 1,
            shareVisibility: 'private' as const,
            studentTypes: [],
            sharedAt: null,
            sharedBy: null,
            analyses: [
              {
                id: 'analysis-1',
                analysisGroupId: 1,
                analysisItemId: 10,
                customAnalysis: null,
                displayOrder: 0
              }
            ],
            practices: [
              {
                id: 'practice-1',
                skillId: 5,
                drillId: 20,
                customDrill: null,
                practiceNotes: 'Focus on balance',
                displayOrder: 0
              }
            ],
            coachRatings: []
          }
        ]
      };

      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(prisma.lessonRecord, 'create').mockResolvedValue(mockCreatedRecord as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.createLessonRecord(createDto);

      expect(result.id).toBe('record-1');
      expect(result.summary).toBe('Great progress today');
      expect(result.details).toHaveLength(1);
      expect(result.details[0].analyses).toHaveLength(1);
      expect(result.details[0].practices).toHaveLength(1);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'system',
          entityId: 'record-1',
          entityType: 'lesson_record',
          action: 'lesson_record_created',
          reason: 'create_lesson_record',
          scope: 'private',
          performedAt: expect.any(Date)
        })
      });
    });

    it('should throw NotFoundException when lesson not found', async () => {
      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(null);

      const createDto = {
        lessonId: 999,
        details: [
          {
            studentMappingId: 'mapping-1'
          }
        ]
      };

      await expect(service.createLessonRecord(createDto as any)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.createLessonRecord(createDto as any)).rejects.toThrow(
        '課程不存在'
      );
    });

    it('should throw ConflictException when record already exists', async () => {
      const mockLesson = {
        id: 1,
        resortId: 1,
        record: { id: 'existing-record' }
      };

      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(mockLesson as any);

      const createDto = {
        lessonId: 1,
        details: [
          {
            studentMappingId: 'mapping-1'
          }
        ]
      };

      await expect(service.createLessonRecord(createDto as any)).rejects.toThrow(
        ConflictException
      );
      await expect(service.createLessonRecord(createDto as any)).rejects.toThrow(
        '此課程已存在教學記錄'
      );
    });
  });

  describe('reorderAnalyses', () => {
    it('should reorder analysis items with transaction', async () => {
      const mockDetail = {
        id: 'detail-1',
        lessonRecordId: 'record-1',
        lessonRecord: {
          id: 'record-1',
          lesson: {
            id: 1
          }
        }
      };

      const reorderDto: ReorderItemsDto = {
        items: [
          { id: 'analysis-2', displayOrder: 0 },
          { id: 'analysis-1', displayOrder: 1 }
        ]
      };

      jest.spyOn(prisma.lessonRecordDetail, 'findUnique').mockResolvedValue(mockDetail as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([] as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.reorderAnalyses('detail-1', reorderDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith({
        actorId: 'system',
        entityId: 'record-1',
        entityType: 'lesson_detail_analysis',
        action: 'reorder',
        reason: 'analysis',
        scope: 'private'
      });
    });

    it('should throw NotFoundException when detail not found', async () => {
      jest.spyOn(prisma.lessonRecordDetail, 'findUnique').mockResolvedValue(null);

      const reorderDto = {
        items: [{ id: 'analysis-1', displayOrder: 0 }]
      };

      await expect(service.reorderAnalyses('invalid-detail', reorderDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('reorderPractices', () => {
    it('should reorder practice items with transaction', async () => {
      const mockDetail = {
        id: 'detail-1',
        lessonRecordId: 'record-1',
        lessonRecord: {
          id: 'record-1',
          lesson: {
            id: 1
          }
        }
      };

      const reorderDto: ReorderItemsDto = {
        items: [
          { id: 'practice-3', displayOrder: 0 },
          { id: 'practice-1', displayOrder: 1 },
          { id: 'practice-2', displayOrder: 2 }
        ]
      };

      jest.spyOn(prisma.lessonRecordDetail, 'findUnique').mockResolvedValue(mockDetail as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([] as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.reorderPractices('detail-1', reorderDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith({
        actorId: 'system',
        entityId: 'record-1',
        entityType: 'lesson_detail_practice',
        action: 'reorder',
        reason: 'practice',
        scope: 'private'
      });
    });

    it('should use index as displayOrder when not provided', async () => {
      const mockDetail = {
        id: 'detail-1',
        lessonRecordId: 'record-1',
        lessonRecord: {
          id: 'record-1',
          lesson: {
            id: 1
          }
        }
      };

      const reorderDto: ReorderItemsDto = {
        items: [
          { id: 'practice-1' }, // No displayOrder
          { id: 'practice-2' }
        ]
      };

      jest.spyOn(prisma.lessonRecordDetail, 'findUnique').mockResolvedValue(mockDetail as any);
      jest.spyOn(prisma, '$transaction').mockResolvedValue([] as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      await service.reorderPractices('detail-1', reorderDto);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('createCoachRatings', () => {
    it('should create multiple coach ratings with transaction', async () => {
      const now = new Date('2024-10-25T10:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      const createDto = {
        ratings: [
          {
            lessonRecordDetailId: 'detail-1',
            abilityId: 1,
            rating: 2,
            proficiencyBand: 'familiar' as CoachProficiencyBand,
            comment: 'Good progress'
          },
          {
            lessonRecordDetailId: 'detail-1',
            abilityId: 2,
            rating: 3,
            proficiencyBand: 'excellent' as CoachProficiencyBand
          }
        ]
      };

      const mockCreatedRatings = [
        {
          id: 'rating-1',
          lessonRecordDetailId: 'detail-1',
          abilityId: 1,
          rating: 2,
          proficiencyBand: 'familiar',
          comment: 'Good progress',
          sourceRatingId: null,
          ratedBy: 'account-1',
          ratedAt: now
        },
        {
          id: 'rating-2',
          lessonRecordDetailId: 'detail-1',
          abilityId: 2,
          rating: 3,
          proficiencyBand: 'excellent',
          comment: null,
          sourceRatingId: null,
          ratedBy: 'account-1',
          ratedAt: now
        }
      ];

      jest.spyOn(prisma, '$transaction').mockResolvedValue(mockCreatedRatings as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      try {
        const result = await service.createCoachRatings('account-1', createDto);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('rating-1');
        expect(result[0].rating).toBe(2);
        expect(result[1].id).toBe('rating-2');
        expect(result[1].rating).toBe(3);
        expect(audit.log).toHaveBeenCalledWith({
          actorId: 'account-1',
          entityType: 'coach_ability_rating',
          action: 'coach_rating_created',
          count: 2,
          scope: 'private'
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('should handle inherited ratings with sourceRatingId', async () => {
      const now = new Date('2024-10-25T10:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      const createDto = {
        ratings: [
          {
            lessonRecordDetailId: 'detail-1',
            abilityId: 1,
            rating: 2,
            proficiencyBand: 'familiar' as CoachProficiencyBand,
            comment: undefined,
            sourceRatingId: 'previous-rating-1'
          }
        ]
      };

      const mockCreatedRating = {
        id: 'rating-1',
        lessonRecordDetailId: 'detail-1',
        abilityId: 1,
        rating: 2,
        proficiencyBand: 'familiar',
        comment: null,
        sourceRatingId: 'previous-rating-1',
        ratedBy: 'account-1',
        ratedAt: now
      };

      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockCreatedRating] as any);
      jest.spyOn(audit, 'log').mockResolvedValue(undefined);

      try {
        const result = await service.createCoachRatings('account-1', createDto);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('rating-1');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('getLatestRatings', () => {
    it('should return deduplicated latest ratings for student', async () => {
      const mockDetail = { id: 'detail-1' };

      jest.spyOn(prisma.lessonRecordDetail, 'findFirst').mockResolvedValue(mockDetail as any);

      const mockRatings = [
        {
          id: 'rating-3',
          abilityId: 1,
          rating: 3,
          proficiencyBand: 'excellent',
          comment: 'Latest rating',
          ratedAt: new Date('2024-10-25T10:00:00Z'),
          ability: { id: 1, name: '轉彎技巧' }
        },
        {
          id: 'rating-1',
          abilityId: 1,
          rating: 2,
          proficiencyBand: 'familiar',
          comment: 'Older rating',
          ratedAt: new Date('2024-10-20T10:00:00Z'),
          ability: { id: 1, name: '轉彎技巧' }
        },
        {
          id: 'rating-2',
          abilityId: 2,
          rating: 2,
          proficiencyBand: 'familiar',
          comment: 'Balance work',
          ratedAt: new Date('2024-10-25T10:00:00Z'),
          ability: { id: 2, name: '平衡感' }
        }
      ];

      jest.spyOn(prisma.coachAbilityRating, 'findMany').mockResolvedValue(mockRatings as any);

      const result = await service.getLatestRatings('mapping-1');

      expect(result).toHaveLength(2);
      expect(result[0].abilityId).toBe(1);
      expect(result[0].rating).toBe(3);
      expect(result[0].abilityName).toBe('轉彎技巧');
      expect(result[1].abilityId).toBe(2);
      expect(result[1].rating).toBe(2);
      expect(result[1].abilityName).toBe('平衡感');

      expect(prisma.lessonRecordDetail.findFirst).toHaveBeenCalledWith({
        where: { studentMappingId: 'mapping-1' },
        select: { id: true }
      });
      expect(prisma.coachAbilityRating.findMany).toHaveBeenCalledWith({
        where: { lessonRecordDetailId: 'detail-1' },
        include: { ability: true },
        orderBy: [{ abilityId: 'asc' }, { ratedAt: 'desc' }]
      });
    });

    it('should return empty array when no ratings exist', async () => {
      jest.spyOn(prisma.lessonRecordDetail, 'findFirst').mockResolvedValue(null);

      const result = await service.getLatestRatings('mapping-1');

      expect(result).toEqual([]);
    });

    it('should handle single rating per ability', async () => {
      const mockDetail = { id: 'detail-1' };
      const mockRatings = [
        {
          id: 'rating-1',
          abilityId: 1,
          rating: 1,
          proficiencyBand: 'knew',
          comment: null,
          ratedAt: new Date('2024-10-25T10:00:00Z'),
          ability: { id: 1, name: '停止' }
        }
      ];

      jest.spyOn(prisma.lessonRecordDetail, 'findFirst').mockResolvedValue(mockDetail as any);
      jest.spyOn(prisma.coachAbilityRating, 'findMany').mockResolvedValue(mockRatings as any);

      const result = await service.getLatestRatings('mapping-1');

      expect(result).toHaveLength(1);
      expect(result[0].abilityId).toBe(1);
      expect(result[0].rating).toBe(1);
      expect(result[0].proficiencyBand).toBe('knew');
    });
  });
});
