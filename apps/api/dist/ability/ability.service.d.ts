import { PrismaService } from '../prisma/prisma.service.js';
import { AbilityResponseDto } from './dto/ability-response.dto.js';
export declare class AbilityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listAbilities(): Promise<AbilityResponseDto[]>;
}
