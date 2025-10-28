import { StudentsService } from './students.service.js';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto.js';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    submitSelfEvaluation(mappingId: string, lessonId: string, dto: CreateSelfEvaluationDto): Promise<{
        id: string;
        studentMappingId: string;
        lessonId: number;
        selfRating: number;
        selfComment: string | null;
        updatedAt: string;
        message: string;
    }>;
}
