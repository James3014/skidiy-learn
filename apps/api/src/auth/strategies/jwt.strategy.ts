import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: string; // Account ID
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  accountId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-change-in-production')
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true }
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    if (account.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      accountId: account.id,
      role: account.role
    };
  }
}
