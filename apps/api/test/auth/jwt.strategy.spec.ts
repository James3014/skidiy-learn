import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            account: {
              findUnique: jest.fn()
            }
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret')
          }
        }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('validate', () => {
    const mockPayload = {
      sub: 'account-123',
      role: 'instructor',
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    it('應該在帳號存在且狀態為 active 時回傳使用者資訊', async () => {
      const mockAccount = {
        id: 'account-123',
        role: 'instructor',
        status: 'active'
      };

      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(mockAccount as any);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        accountId: 'account-123',
        role: 'instructor'
      });
      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'account-123' },
        select: { id: true, role: true, status: true }
      });
    });

    it('應該在帳號不存在時拋出 UnauthorizedException', async () => {
      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockPayload)).rejects.toThrow('Account not found');
    });

    it('應該在帳號狀態不是 active 時拋出 UnauthorizedException', async () => {
      const inactiveAccount = {
        id: 'account-123',
        role: 'instructor',
        status: 'suspended'
      };

      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(inactiveAccount as any);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('應該正確處理不同角色', async () => {
      const adminAccount = {
        id: 'admin-456',
        role: 'admin',
        status: 'active'
      };

      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(adminAccount as any);

      const result = await strategy.validate({ ...mockPayload, sub: 'admin-456', role: 'admin' });

      expect(result).toEqual({
        accountId: 'admin-456',
        role: 'admin'
      });
    });
  });
});
