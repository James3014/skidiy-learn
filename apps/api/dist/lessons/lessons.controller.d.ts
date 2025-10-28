import { LessonsService } from './lessons.service.js';
import { CreateLessonDto } from './dto/create-lesson.dto.js';
import { LessonResponseDto } from './dto/lesson-response.dto.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    findAll(role?: 'coach' | 'student', date?: string, instructorId?: string, resortId?: string): Promise<LessonResponseDto[]>;
    create(dto: CreateLessonDto): Promise<LessonResponseDto>;
    findOne(id: number): Promise<LessonResponseDto>;
    getSeats(id: number, include?: string): Promise<SeatResponseDto[]>;
}
