import { Test } from '@nestjs/testing';
import { LessonRecordService } from '../../src/lesson-record/lesson-record.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { AuditService } from '../../src/audit/audit.service.js';
import { RateLimiterService } from '../../src/rate-limiter/rate-limiter.service.js';

describe('LessonRecordService', () => {
  const baseRecord = {
    id: 'record-1',
    lessonId: 42,
    summary: 'summary',
    videos: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lesson: {
      id: 42,
      resortId: 88,
      instructorId: 'instructor-1',
      lessonDate: new Date('2025-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    details: [
      {
        id: 'detail-1',
        lessonRecordId: 'record-1',
        studentMappingId: 'mapping-1',
        resortId: 88,
        shareVisibility: 'private',
        studentTypes: ['doer'],
        sharedAt: null,
        sharedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        analyses: [],
        practices: [],
        coachRatings: []
      }
    ]
  };

  it('returns private records', async () => {
    const prismaMock = {
      lessonRecord: {
        findMany: jest.fn().mockResolvedValue([baseRecord])
      },
      instructor: {
        findUnique: jest.fn()
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        LessonRecordService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: RateLimiterService, useValue: { consume: jest.fn().mockResolvedValue(undefined) } }
      ]
    }).compile();

    const service = module.get(LessonRecordService);
    const records = await service.listPrivateRecords('demo');

    expect(records).toMatchObject([
      {
        id: 'record-1',
        lessonId: 42,
        summary: 'summary',
        videos: null,
        details: [
          {
            id: 'detail-1',
            lessonRecordId: 'record-1',
            studentMappingId: 'mapping-1',
            resortId: 88,
            shareVisibility: 'private',
            studentTypes: ['doer'],
            sharedAt: null,
            sharedBy: null,
            analyses: [],
            practices: [],
            coachRatings: []
          }
        ]
      }
    ]);
  });

  it('returns shared records when instructor can view', async () => {
    const prismaMock = {
      instructor: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'instr-1',
          accountId: 'demo',
          canViewSharedRecords: true
        })
      },
      lessonRecordDetail: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'detail-2',
            lessonRecordId: 'record-2',
            lessonRecord: {
              id: 'record-2',
              lessonId: 55,
              lesson: {
                lessonDate: new Date('2025-02-02'),
                resortId: 77,
                instructorId: 'instructor-2'
              }
            },
            resortId: 77,
            shareVisibility: 'resort',
            sharedAt: new Date('2025-02-03'),
            sharedBy: 'coach-2',
            studentTypes: ['thinker'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      }
    } as unknown as PrismaService;

    const auditMock = { log: jest.fn() };
    const rateLimiterMock = { consume: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        LessonRecordService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: RateLimiterService, useValue: rateLimiterMock }
      ]
    }).compile();

    const service = module.get(LessonRecordService);
    const records = await service.listSharedRecords('demo');

    expect(records).toEqual([
      {
        id: 'record-2',
        detailId: 'detail-2',
        lessonDate: new Date('2025-02-02').toISOString(),
        resortId: 77,
        instructorId: 'instructor-2',
        shareVisibility: 'resort'
      }
    ]);
    expect(rateLimiterMock.consume).toHaveBeenCalledWith('shared-query:demo', 30, 60_000);
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'lesson_records_shared_query', actorId: 'demo' })
    );
  });
});
