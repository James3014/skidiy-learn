import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto.js';
export declare class StudentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submitSelfEvaluation(mappingId: string, lessonId: number, dto: CreateSelfEvaluationDto): Promise<{
        id: string;
        studentMappingId: string;
        lessonId: number;
        selfRating: number;
        selfComment: string | null;
        updatedAt: string;
        message: string;
    }>;
}
