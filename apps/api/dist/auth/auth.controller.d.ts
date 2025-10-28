import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './strategies/jwt.strategy.js';
declare class LoginDto {
    accountId: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("./auth.service.js").LoginResponse>;
    getMe(user: AuthenticatedUser): Promise<{
        accountId: string;
        role: string;
    }>;
}
export {};
