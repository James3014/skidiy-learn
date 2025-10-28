var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(accountId) {
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
        const payload = {
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
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return {
                accountId: payload.sub,
                role: payload.role
            };
        }
        catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map