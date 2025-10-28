import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: PrismaService,
          useValue: {
            lesson: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn()
            },
            orderSeat: {
              findMany: jest.fn()
            }
          }
        }
      ]
    }).compile();

    service = module.get<LessonsService>(LessonsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return lessons with seat counts', async () => {
      const mockLessons = [
        {
          id: 1,
          resortId: 1,
          instructorId: 'instructor-1',
          lessonDate: new Date('2025-01-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
          seats: [{}, {}, {}] // 3 seats
        }
      ];

      jest.spyOn(prisma.lesson, 'findMany').mockResolvedValue(mockLessons as any);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].seatCount).toBe(3);
    });

    it('should filter by date', async () => {
      const targetDate = '2025-01-15';
      jest.spyOn(prisma.lesson, 'findMany').mockResolvedValue([]);

      await service.findAll({ date: targetDate });

      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lessonDate: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date)
            })
          })
        })
      );
    });
  });

  describe('create', () => {
    it('should create lesson with specified number of seats', async () => {
      const dto = {
        resortId: 1,
        instructorId: 'instructor-1',
        lessonDate: '2025-01-15',
        seatCount: 4
      };

      const mockLesson = {
        id: 1,
        resortId: 1,
        instructorId: 'instructor-1',
        lessonDate: new Date('2025-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        seats: [
          { seatNumber: 1 },
          { seatNumber: 2 },
          { seatNumber: 3 },
          { seatNumber: 4 }
        ]
      };

      jest.spyOn(prisma.lesson, 'create').mockResolvedValue(mockLesson as any);

      const result = await service.create(dto);

      expect(result.seatCount).toBe(4);
      expect(prisma.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            seats: {
              create: expect.arrayContaining([
                expect.objectContaining({ seatNumber: 1 }),
                expect.objectContaining({ seatNumber: 4 })
              ])
            }
          })
        })
      );
    });
  });

  describe('getSeatsWithStatus', () => {
    it('should return seats without self evaluation by default', async () => {
      const mockLesson = {
        id: 1,
        resortId: 1,
        instructorId: 'instructor-1',
        lessonDate: new Date()
      };

      const mockSeats = [
        {
          id: 'seat-1',
          lessonId: 1,
          seatNumber: 1,
          status: 'pending' as const,
          claimedMappingId: null,
          claimedAt: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(prisma.orderSeat, 'findMany').mockResolvedValue(mockSeats as any);

      const result = await service.getSeatsWithStatus(1, false);

      expect(result).toHaveLength(1);
      expect(result[0].selfEval).toBeUndefined();
    });

    it('should include self evaluation when requested', async () => {
      const mockLesson = {
        id: 1,
        resortId: 1,
        instructorId: 'instructor-1',
        lessonDate: new Date()
      };

      const mockSeats = [
        {
          id: 'seat-1',
          lessonId: 1,
          seatNumber: 1,
          status: 'claimed' as const,
          claimedMappingId: 'mapping-1',
          claimedAt: new Date(),
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          claimedMapping: {
            selfEvaluations: [
              {
                lessonId: 1,
                selfRating: 2,
                selfComment: '覺得還可以'
              }
            ]
          }
        }
      ];

      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(prisma.orderSeat, 'findMany').mockResolvedValue(mockSeats as any);

      const result = await service.getSeatsWithStatus(1, true);

      expect(result).toHaveLength(1);
      expect(result[0].selfEval).toEqual({
        selfRating: 2,
        selfComment: '覺得還可以'
      });
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(null);

      await expect(service.getSeatsWithStatus(999)).rejects.toThrow(NotFoundException);
    });
  });
});
