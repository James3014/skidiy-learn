import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
export interface LoginResponse {
    accessToken: string;
    accountId: string;
    role: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(accountId: string): Promise<LoginResponse>;
    validateToken(token: string): Promise<{
        accountId: string;
        role: string;
    }>;
}
