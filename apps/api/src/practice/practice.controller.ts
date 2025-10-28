import { Controller, Get } from '@nestjs/common';
import { PracticeService } from './practice.service.js';
import { SkillResponseDto } from './dto/skill-response.dto.js';

@Controller('practice-skills')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get()
  async getSkills(): Promise<SkillResponseDto[]> {
    return this.practiceService.listSkills();
  }
}
