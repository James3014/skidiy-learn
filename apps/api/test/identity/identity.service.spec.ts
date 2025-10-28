import { Test } from '@nestjs/testing';
import { IdentityService } from '../../src/identity/identity.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { AuditService } from '../../src/audit/audit.service.js';

describe('IdentityService', () => {
  it('upserts invitation', async () => {
    const prismaMock = {
      seatInvitation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          code: 'ABC12345',
          seatId: 'seat-1',
          expiresAt: new Date('2025-01-01'),
          claimedAt: null,
          claimedBy: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } }
      ]
    }).compile();

    const service = module.get(IdentityService);
    const invitation = await service.generateInvitation('seat-1');

    expect(prismaMock.seatInvitation.findFirst).toHaveBeenCalled();
    expect(invitation.seatId).toBe('seat-1');
    expect(invitation.code).toHaveLength(8);
  });

  it('confirms seat claim', async () => {
    const prismaMock = {
      seatIdentityForm: {
        update: jest.fn().mockResolvedValue({
          id: 'form-1',
          seatId: 'seat-1',
          status: 'confirmed',
          studentName: '小明',
          studentEnglish: null,
          birthDate: null,
          contactEmail: null,
          guardianEmail: null,
          contactPhone: null,
          isMinor: false,
          hasExternalInsurance: false,
          insuranceProvider: null,
          note: null,
          submittedAt: null,
          confirmedAt: new Date('2025-01-02'),
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      orderSeat: {
        update: jest.fn().mockResolvedValue({
          id: 'seat-1',
          status: 'claimed',
          claimedAt: new Date('2025-01-02')
        })
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: jest.fn() } }
      ]
    }).compile();

    const service = module.get(IdentityService);
    const form = await service.confirmSeatClaim('seat-1');

    expect(form.status).toBe('confirmed');
  });
});
