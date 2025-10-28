import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

export interface LoginResponse {
  accessToken: string;
  accountId: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Simple login method for development
   * In production, this would verify credentials against Keycloak/OIDC
   */
  async login(accountId: string): Promise<LoginResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, role: true, status: true }
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    if (account.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const payload: JwtPayload = {
      sub: account.id,
      role: account.role
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      accountId: account.id,
      role: account.role
    };
  }

  /**
   * Validate token and return user info
   */
  async validateToken(token: string): Promise<{ accountId: string; role: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return {
        accountId: payload.sub,
        role: payload.role
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
