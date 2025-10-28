import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service.js';
import { CreateSelfEvaluationDto } from './dto/create-self-evaluation.dto.js';

@ApiTags('students')
@Controller('api/v1/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post(':mappingId/lessons/:lessonId/self-eval')
  @ApiOperation({ summary: 'Submit or update student self-evaluation for a lesson' })
  @ApiParam({ name: 'mappingId', description: 'Student mapping ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID', type: 'integer' })
  async submitSelfEvaluation(
    @Param('mappingId') mappingId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateSelfEvaluationDto
  ) {
    const lessonIdNum = parseInt(lessonId, 10);
    return this.studentsService.submitSelfEvaluation(mappingId, lessonIdNum, dto);
  }
}
