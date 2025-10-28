import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, GoneException, NotFoundException } from '@nestjs/common';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: PrismaService,
          useValue: {
            orderSeat: {
              findUnique: jest.fn(),
              update: jest.fn()
            },
            seatInvitation: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn()
            },
            globalStudent: {
              findFirst: jest.fn(),
              create: jest.fn()
            },
            studentMapping: {
              create: jest.fn(),
              delete: jest.fn()
            },
            lesson: {
              findUnique: jest.fn()
            },
            seatIdentityForm: {
              findUnique: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn()
            },
            guardianRelationship: {
              findFirst: jest.fn(),
              create: jest.fn()
            },
            $transaction: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    prisma = module.get<PrismaService>(PrismaService);

    (prisma.$transaction as jest.Mock).mockImplementation(async (work: (tx: any) => Promise<unknown>) => {
      return work(prisma);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvitation', () => {
    it('should generate an 8-character invitation code', async () => {
      const mockSeat = {
        id: 'seat-1',
        lessonId: 1,
        seatNumber: 1,
        status: 'pending' as const,
        version: 1
      };

      const mockInvitation = {
        code: 'ABC12345',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        claimedAt: null,
        claimedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.orderSeat, 'findUnique').mockResolvedValue(mockSeat as any);
      jest.spyOn(prisma.seatInvitation, 'create').mockResolvedValue(mockInvitation);
      jest.spyOn(prisma.orderSeat, 'update').mockResolvedValue({} as any);

      const result = await service.generateInvitation('seat-1', 7);

      expect(result.code).toBe('ABC12345');
      expect(result.isExpired).toBe(false);
      expect(result.isClaimed).toBe(false);
    });

    it('should throw NotFoundException if seat does not exist', async () => {
      jest.spyOn(prisma.orderSeat, 'findUnique').mockResolvedValue(null);

      await expect(service.generateInvitation('invalid-seat')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyCode', () => {
    it('should return valid invitation', async () => {
      const mockInvitation = {
        code: 'VALID123',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        claimedAt: null,
        claimedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(mockInvitation);

      const result = await service.verifyCode('VALID123');

      expect(result.code).toBe('VALID123');
      expect(result.isExpired).toBe(false);
    });

    it('should throw NotFoundException for invalid code', async () => {
      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(null);

      await expect(service.verifyCode('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException for expired invitation', async () => {
      const mockInvitation = {
        code: 'EXPIRED1',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 已過期
        claimedAt: null,
        claimedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(mockInvitation);

      await expect(service.verifyCode('EXPIRED1')).rejects.toThrow(GoneException);
    });

    it('should throw ConflictException for already claimed invitation', async () => {
      const mockInvitation = {
        code: 'CLAIMED1',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        claimedAt: new Date(),
        claimedBy: 'mapping-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(mockInvitation);

      await expect(service.verifyCode('CLAIMED1')).rejects.toThrow(ConflictException);
    });
  });

  describe('claimSeat - optimistic locking', () => {
    it('should successfully claim a seat with optimistic lock', async () => {
      const mockInvitation = {
        code: 'VALID123',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        claimedAt: null,
        claimedBy: null,
        seat: {
          id: 'seat-1',
          lessonId: 1,
          seatNumber: 1,
          status: 'invited' as const,
          version: 1,
          identityForm: {
            status: 'submitted' as const
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockLesson = {
        id: 1,
        resortId: 1
      };

      const mockGlobalStudent = {
        id: 'student-uuid',
        email: 'test@example.com'
      };

      const mockMapping = {
        id: 'mapping-1',
        globalStudentId: 'student-uuid',
        resortId: 1
      };

      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);
      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue(mockLesson as any);
      jest.spyOn(prisma.globalStudent, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.globalStudent, 'create').mockResolvedValue(mockGlobalStudent as any);
      jest.spyOn(prisma.studentMapping, 'create').mockResolvedValue(mockMapping as any);
      jest.spyOn(prisma.orderSeat, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.seatInvitation, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.seatIdentityForm, 'update').mockResolvedValue({} as any);

      const result = await service.claimSeat({
        code: 'VALID123',
        studentName: 'Test Student',
        contactEmail: 'test@example.com'
      });

      expect(result.seatId).toBe('seat-1');
      expect(result.mappingId).toBe('mapping-1');
      expect(result.message).toBe('席位認領成功');
    });

    it('should handle concurrent claim attempts with optimistic lock', async () => {
      const mockInvitation = {
        code: 'VALID123',
        seatId: 'seat-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        claimedAt: null,
        claimedBy: null,
        seat: {
          id: 'seat-1',
          lessonId: 1,
          seatNumber: 1,
          status: 'invited' as const,
          version: 1,
          identityForm: {
            status: 'submitted' as const
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(prisma.seatInvitation, 'findUnique').mockResolvedValue(mockInvitation as any);
      jest.spyOn(prisma.lesson, 'findUnique').mockResolvedValue({ id: 1, resortId: 1 } as any);
      jest.spyOn(prisma.globalStudent, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.globalStudent, 'create').mockResolvedValue({ id: 'student-uuid' } as any);
      jest.spyOn(prisma.studentMapping, 'create').mockResolvedValue({ id: 'mapping-1' } as any);

      // 模擬樂觀鎖衝突
      jest.spyOn(prisma.orderSeat, 'update').mockRejectedValue(
        new Error('Version mismatch')
      );
      await expect(
        service.claimSeat({
          code: 'VALID123',
          studentName: 'Test Student',
          contactEmail: 'test@example.com'
        })
      ).rejects.toThrow(ConflictException);

      expect(prisma.studentMapping.create).toHaveBeenCalled();
      expect(prisma.studentMapping.delete).not.toHaveBeenCalled();
    });
  });
});
