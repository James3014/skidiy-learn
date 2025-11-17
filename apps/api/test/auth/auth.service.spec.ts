import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn()
          }
        },
        {
          provide: PrismaService,
          useValue: {
            account: {
              findUnique: jest.fn()
            }
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('login', () => {
    const mockAccount = {
      id: 'account-123',
      role: 'instructor',
      status: 'active'
    };

    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('應該在生產環境時拋出 UnauthorizedException', async () => {
      process.env.NODE_ENV = 'production';

      await expect(service.login('account-123')).rejects.toThrow(UnauthorizedException);
      await expect(service.login('account-123')).rejects.toThrow(
        'Development login is disabled in production'
      );
    });

    it('應該在帳號存在且為 active 時成功登入', async () => {
      process.env.NODE_ENV = 'development';
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(mockAccount as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login('account-123');

      expect(result).toEqual({
        accessToken: mockToken,
        accountId: 'account-123',
        role: 'instructor'
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'account-123',
        role: 'instructor'
      });
    });

    it('應該在帳號不存在時拋出 UnauthorizedException', async () => {
      process.env.NODE_ENV = 'development';
      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(null);

      await expect(service.login('non-existent')).rejects.toThrow(UnauthorizedException);
      await expect(service.login('non-existent')).rejects.toThrow('Account not found');
    });

    it('應該在帳號不是 active 狀態時拋出 UnauthorizedException', async () => {
      process.env.NODE_ENV = 'development';
      const inactiveAccount = { ...mockAccount, status: 'suspended' };
      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(inactiveAccount as any);

      await expect(service.login('account-123')).rejects.toThrow(UnauthorizedException);
      await expect(service.login('account-123')).rejects.toThrow('Account is not active');
    });

    it('應該正確處理不同角色', async () => {
      process.env.NODE_ENV = 'development';
      const adminAccount = { id: 'admin-456', role: 'admin', status: 'active' };
      const mockToken = 'admin-token';

      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(adminAccount as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login('admin-456');

      expect(result.role).toBe('admin');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'admin-456',
        role: 'admin'
      });
    });
  });

  describe('validateToken', () => {
    it('應該在 token 有效時回傳使用者資訊', async () => {
      const mockPayload = { sub: 'account-123', role: 'instructor' };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload as any);

      const result = await service.validateToken('valid-token');

      expect(result).toEqual({
        accountId: 'account-123',
        role: 'instructor'
      });
    });

    it('應該在 token 無效時拋出 UnauthorizedException', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.validateToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('應該在 token 過期時拋出 UnauthorizedException', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Token expired'));

      await expect(service.validateToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
