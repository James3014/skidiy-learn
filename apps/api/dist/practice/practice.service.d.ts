import { PrismaService } from '../prisma/prisma.service.js';
import { SkillResponseDto } from './dto/skill-response.dto.js';
export declare class PracticeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listSkills(): Promise<SkillResponseDto[]>;
}
