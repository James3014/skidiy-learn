import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { LessonResponseDto } from './dto/lesson-response.dto.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
export interface LessonFilters {
    role?: 'coach' | 'student';
    date?: string;
    instructorId?: string;
    resortId?: number;
}
export declare class LessonsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: LessonFilters): Promise<LessonResponseDto[]>;
    findOne(id: number): Promise<LessonResponseDto>;
    create(dto: CreateLessonDto): Promise<LessonResponseDto>;
    getSeatsWithStatus(lessonId: number, includeSelfEval?: boolean): Promise<SeatResponseDto[]>;
}
