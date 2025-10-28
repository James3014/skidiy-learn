import { PracticeService } from './practice.service.js';
import { SkillResponseDto } from './dto/skill-response.dto.js';
export declare class PracticeController {
    private readonly practiceService;
    constructor(practiceService: PracticeService);
    getSkills(): Promise<SkillResponseDto[]>;
}
