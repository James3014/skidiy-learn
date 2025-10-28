import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../../src/auth/guards/roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user })
    }),
    getHandler: jest.fn(),
    getClass: jest.fn()
  } as any);

  describe('canActivate', () => {
    it('應該在沒有角色需求時允許存取', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ accountId: 'user-1', role: 'instructor' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('應該在使用者角色符合需求時允許存取', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['instructor']);

      const context = createMockContext({ accountId: 'user-1', role: 'instructor' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('應該在使用者角色不符合需求時拋出 ForbiddenException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const context = createMockContext({ accountId: 'user-1', role: 'instructor' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Requires one of roles: admin');
    });

    it('應該支援多個角色需求', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['instructor', 'admin']);

      const instructorContext = createMockContext({ accountId: 'user-1', role: 'instructor' });
      const adminContext = createMockContext({ accountId: 'user-2', role: 'admin' });
      const studentContext = createMockContext({ accountId: 'user-3', role: 'student' });

      expect(guard.canActivate(instructorContext)).toBe(true);
      expect(guard.canActivate(adminContext)).toBe(true);
      expect(() => guard.canActivate(studentContext)).toThrow(ForbiddenException);
    });

    it('應該正確讀取裝飾器中的角色設定', () => {
      const mockRoles = ['instructor', 'admin'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(mockRoles);

      const context = createMockContext({ accountId: 'user-1', role: 'instructor' });
      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [context.getHandler(), context.getClass()]
      );
    });
  });
});
